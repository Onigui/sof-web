<?php

namespace Tests\Feature;

use App\Billing\Providers\MercadoPagoProvider;
use App\Models\BillingInvoice;
use App\Models\Empresa;
use App\Models\EmpresaSubscription;
use App\Services\Payments\PaymentProviderFactory;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\MercadoPagoConfig;
use Mockery;
use Tests\TestCase;

class MercadoPagoProviderTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_create_checkout_salva_provider_invoice_id_e_url(): void
    {
        putenv('MERCADOPAGO_ACCESS_TOKEN=token');
        putenv('MERCADOPAGO_USE_SANDBOX=true');
        putenv('APP_WEB_URL=https://app.example');
        putenv('APP_API_URL=https://api.example');

        $empresa = Empresa::factory()->create();
        $invoice = BillingInvoice::create([
            'empresa_id' => $empresa->id,
            'referencia_mes' => '2025-03',
            'status' => BillingInvoice::STATUS_OPEN,
            'currency' => 'BRL',
            'monthly_fee_centavos' => 1000,
            'variable_fee_centavos' => 200,
            'total_centavos' => 1200,
        ]);

        $preferenceMock = (object) [
            'id' => 'pref-1',
            'init_point' => 'https://checkout',
            'sandbox_init_point' => 'https://sandbox',
        ];

        Mockery::mock('overload:'.PreferenceClient::class)
            ->shouldReceive('create')
            ->once()
            ->andReturn($preferenceMock);

        $provider = new MercadoPagoProvider();
        $response = $provider->createCheckout($invoice);

        $this->assertSame('pref-1', $response['provider_invoice_id']);
        $this->assertSame('https://sandbox', $response['checkout_url']);
    }

    public function test_webhook_aprovado_ativa_invoice_e_subscription(): void
    {
        putenv('MERCADOPAGO_ACCESS_TOKEN=token');
        putenv('MERCADOPAGO_WEBHOOK_SECRET=secret');

        $empresa = Empresa::factory()->create();
        $invoice = BillingInvoice::create([
            'empresa_id' => $empresa->id,
            'referencia_mes' => '2025-03',
            'status' => BillingInvoice::STATUS_OPEN,
            'currency' => 'BRL',
            'monthly_fee_centavos' => 1000,
            'variable_fee_centavos' => 200,
            'total_centavos' => 1200,
        ]);

        $paymentMock = (object) [
            'status' => 'approved',
            'status_detail' => 'approved',
            'external_reference' => 'invoice:'.$invoice->id,
            'order' => (object) ['id' => 'order-1'],
        ];

        Mockery::mock('overload:'.PaymentClient::class)
            ->shouldReceive('get')
            ->once()
            ->andReturn($paymentMock);

        $response = $this->postJson('/api/v1/billing/webhooks/mercadopago', [
            'data' => ['id' => 'pay-1'],
        ], [
            'X-MP-Signature' => 'secret',
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('billing_invoices', [
            'id' => $invoice->id,
            'status' => BillingInvoice::STATUS_PAID,
        ]);

        $this->assertDatabaseHas('empresa_subscriptions', [
            'empresa_id' => $empresa->id,
            'status' => EmpresaSubscription::STATUS_ATIVA,
        ]);
    }
}
