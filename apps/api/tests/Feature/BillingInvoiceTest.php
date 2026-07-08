<?php

namespace Tests\Feature;

use App\Models\BillingEvent;
use App\Models\BillingInvoice;
use App\Models\BillingPaymentAttempt;
use App\Models\BillingSetting;
use App\Models\Empresa;
use App\Models\EmpresaSubscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BillingInvoiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_gera_invoice_do_mes_com_valores_corretos(): void
    {
        $empresa = Empresa::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_GESTAO,
        ]);

        BillingSetting::create([
            'empresa_id' => $empresa->id,
            'monthly_fee_centavos' => 1000,
            'per_integrada_centavos' => 200,
            'currency' => 'BRL',
            'active' => true,
        ]);

        BillingEvent::create([
            'empresa_id' => $empresa->id,
            'tipo_evento' => BillingEvent::TIPO_INTEGRADA,
            'proposta_id' => null,
            'integracao_id' => null,
            'valor_centavos' => 200,
            'gerado_em' => Carbon::parse('2025-02-10 10:00:00'),
        ]);

        Sanctum::actingAs($gestao);

        $this->getJson('/api/v1/billing/invoices?month=2025-02')
            ->assertOk()
            ->assertJsonFragment([
                'referencia_mes' => '2025-02',
                'monthly_fee_centavos' => 1000,
                'variable_fee_centavos' => 200,
                'total_centavos' => 1200,
            ]);
    }

    public function test_checkout_cria_tentativa_e_salva_url(): void
    {
        $empresa = Empresa::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_GESTAO,
        ]);

        $invoice = BillingInvoice::create([
            'empresa_id' => $empresa->id,
            'referencia_mes' => '2025-02',
            'status' => BillingInvoice::STATUS_OPEN,
            'currency' => 'BRL',
            'monthly_fee_centavos' => 1000,
            'variable_fee_centavos' => 200,
            'total_centavos' => 1200,
        ]);

        Sanctum::actingAs($gestao);

        $this->postJson("/api/v1/billing/invoices/{$invoice->id}/checkout")
            ->assertOk()
            ->assertJsonStructure(['data' => ['checkout_url']]);

        $this->assertDatabaseHas('billing_payment_attempts', [
            'billing_invoice_id' => $invoice->id,
            'status' => BillingPaymentAttempt::STATUS_REDIRECTED,
        ]);
    }

    public function test_webhook_manual_valido_marca_paid_e_ativa_subscription(): void
    {
        $empresa = Empresa::factory()->create();

        $invoice = BillingInvoice::create([
            'empresa_id' => $empresa->id,
            'referencia_mes' => '2025-02',
            'status' => BillingInvoice::STATUS_OPEN,
            'currency' => 'BRL',
            'monthly_fee_centavos' => 1000,
            'variable_fee_centavos' => 200,
            'total_centavos' => 1200,
        ]);

        putenv('MANUAL_WEBHOOK_SECRET=secret');

        $this->postJson('/api/v1/billing/webhooks/manual', [
            'invoice_id' => $invoice->id,
            'paid' => true,
        ], [
            'X-Manual-Signature' => 'secret',
        ])->assertOk();

        $this->assertDatabaseHas('billing_invoices', [
            'id' => $invoice->id,
            'status' => BillingInvoice::STATUS_PAID,
        ]);

        $this->assertDatabaseHas('empresa_subscriptions', [
            'empresa_id' => $empresa->id,
            'status' => EmpresaSubscription::STATUS_ATIVA,
        ]);
    }

    public function test_webhook_manual_assinatura_invalida_retorna_401(): void
    {
        $invoice = BillingInvoice::create([
            'empresa_id' => Empresa::factory()->create()->id,
            'referencia_mes' => '2025-02',
            'status' => BillingInvoice::STATUS_OPEN,
            'currency' => 'BRL',
            'monthly_fee_centavos' => 1000,
            'variable_fee_centavos' => 200,
            'total_centavos' => 1200,
        ]);

        putenv('MANUAL_WEBHOOK_SECRET=secret');

        $this->postJson('/api/v1/billing/webhooks/manual', [
            'invoice_id' => $invoice->id,
            'paid' => true,
        ], [
            'X-Manual-Signature' => 'invalid',
        ])->assertStatus(401);
    }

    public function test_gestao_nao_acessa_invoice_de_outra_empresa(): void
    {
        $empresaA = Empresa::factory()->create();
        $empresaB = Empresa::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresaA->id,
            'role' => User::ROLE_GESTAO,
        ]);

        $invoice = BillingInvoice::create([
            'empresa_id' => $empresaB->id,
            'referencia_mes' => '2025-02',
            'status' => BillingInvoice::STATUS_OPEN,
            'currency' => 'BRL',
            'monthly_fee_centavos' => 1000,
            'variable_fee_centavos' => 200,
            'total_centavos' => 1200,
        ]);

        Sanctum::actingAs($gestao);

        $this->postJson("/api/v1/billing/invoices/{$invoice->id}/checkout")
            ->assertNotFound();
    }
}
