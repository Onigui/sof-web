<?php

namespace Tests\Feature;

use App\Models\BillingInvoice;
use App\Models\BillingSetting;
use App\Models\Empresa;
use App\Models\EmpresaSubscription;
use App\Models\User;
use App\Notifications\InvoiceAbertaNotification;
use App\Notifications\InvoiceLembreteNotification;
use App\Notifications\SubscriptionSuspensaNotification;
use App\Services\BillingCycleService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class BillingCycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_gera_invoice_com_due_date_e_notifica(): void
    {
        Notification::fake();

        $empresa = Empresa::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_GESTAO,
        ]);

        BillingSetting::create([
            'empresa_id' => $empresa->id,
            'monthly_fee_centavos' => 1000,
            'per_integrada_centavos' => 0,
            'currency' => 'BRL',
            'active' => true,
        ]);

        $service = app(BillingCycleService::class);
        $service->generateMonthlyInvoicesForCurrentMonth('2025-04');

        $this->assertDatabaseHas('billing_invoices', [
            'empresa_id' => $empresa->id,
            'referencia_mes' => '2025-04',
            'status' => BillingInvoice::STATUS_OPEN,
        ]);

        Notification::assertSentTo($gestao, InvoiceAbertaNotification::class);
    }

    public function test_dunning_envia_lembretes_uma_vez(): void
    {
        Notification::fake();

        $empresa = Empresa::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_GESTAO,
        ]);

        $invoice = BillingInvoice::create([
            'empresa_id' => $empresa->id,
            'referencia_mes' => '2025-04',
            'status' => BillingInvoice::STATUS_OPEN,
            'currency' => 'BRL',
            'monthly_fee_centavos' => 1000,
            'variable_fee_centavos' => 0,
            'total_centavos' => 1000,
            'due_date' => Carbon::parse('2025-04-10')->toDateString(),
        ]);

        $service = app(BillingCycleService::class);
        $service->runDunningForDate(Carbon::parse('2025-04-07'));
        $service->runDunningForDate(Carbon::parse('2025-04-07'));

        Notification::assertSentToTimes($gestao, InvoiceLembreteNotification::class, 1);

        $invoice->refresh();
        $this->assertTrue($invoice->metadata['reminded_before'] ?? false);
    }

    public function test_suspende_apos_grace(): void
    {
        Notification::fake();

        $empresa = Empresa::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_GESTAO,
        ]);

        EmpresaSubscription::create([
            'empresa_id' => $empresa->id,
            'status' => EmpresaSubscription::STATUS_ATIVA,
            'trial_ends_at' => Carbon::now()->addDays(5),
            'grace_days' => 1,
        ]);

        BillingInvoice::create([
            'empresa_id' => $empresa->id,
            'referencia_mes' => '2025-04',
            'status' => BillingInvoice::STATUS_OPEN,
            'currency' => 'BRL',
            'monthly_fee_centavos' => 1000,
            'variable_fee_centavos' => 0,
            'total_centavos' => 1000,
            'due_date' => Carbon::parse('2025-04-10')->toDateString(),
        ]);

        $service = app(BillingCycleService::class);
        $service->runDunningForDate(Carbon::parse('2025-04-12'));

        $this->assertDatabaseHas('empresa_subscriptions', [
            'empresa_id' => $empresa->id,
            'status' => EmpresaSubscription::STATUS_SUSPENSA,
        ]);

        Notification::assertSentTo($gestao, SubscriptionSuspensaNotification::class);
    }
}
