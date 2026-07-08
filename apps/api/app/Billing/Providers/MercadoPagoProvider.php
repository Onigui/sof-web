<?php

namespace App\Billing\Providers;

use App\Models\BillingInvoice;
use App\Services\Payments\PaymentProvider;
use Illuminate\Http\Request;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\MercadoPagoConfig;

class MercadoPagoProvider implements PaymentProvider
{
    public function createCheckout(BillingInvoice $invoice): array
    {
        $accessToken = env('MERCADOPAGO_ACCESS_TOKEN');

        if (!$accessToken) {
            abort(500, 'Mercado Pago access token missing.');
        }

        MercadoPagoConfig::setAccessToken($accessToken);
        MercadoPagoConfig::setRuntimeEnviroment($this->runtimeEnvironment());

        $webUrl = rtrim((string) env('APP_WEB_URL'), '/');
        $apiUrl = rtrim((string) env('APP_API_URL'), '/');

        $client = new PreferenceClient();

        $preference = $client->create([
            'items' => [
                [
                    'title' => "SOF - Assinatura {$invoice->referencia_mes}",
                    'quantity' => 1,
                    'currency_id' => $invoice->currency,
                    'unit_price' => $invoice->total_centavos / 100,
                ],
            ],
            'external_reference' => "invoice:{$invoice->id}",
            'back_urls' => [
                'success' => "{$webUrl}/app/billing?payment=success&invoice={$invoice->id}",
                'failure' => "{$webUrl}/app/billing?payment=failure&invoice={$invoice->id}",
                'pending' => "{$webUrl}/app/billing?payment=pending&invoice={$invoice->id}",
            ],
            'auto_return' => 'approved',
            'notification_url' => "{$apiUrl}/api/v1/billing/webhooks/mercadopago",
        ]);

        $checkoutUrl = env('MERCADOPAGO_USE_SANDBOX')
            ? $preference->sandbox_init_point
            : $preference->init_point;

        return [
            'provider_invoice_id' => $preference->id,
            'checkout_url' => $checkoutUrl,
        ];
    }

    public function verifyWebhook(Request $request): array
    {
        $secret = env('MERCADOPAGO_WEBHOOK_SECRET');
        $signature = $request->header('X-MP-Signature');

        if ($secret && $signature !== $secret) {
            abort(401, 'Invalid signature');
        }

        $paymentId = $this->extractPaymentId($request->all());

        $accessToken = env('MERCADOPAGO_ACCESS_TOKEN');

        if (!$accessToken) {
            abort(500, 'Mercado Pago access token missing.');
        }

        MercadoPagoConfig::setAccessToken($accessToken);
        MercadoPagoConfig::setRuntimeEnviroment($this->runtimeEnvironment());

        $payment = (new PaymentClient())->get($paymentId);

        $externalReference = $payment->external_reference ?? null;
        $invoiceId = $this->extractInvoiceId($externalReference);

        return [
            'type' => $payment->status_detail ?? 'payment',
            'invoice_ref' => (string) $invoiceId,
            'paid' => $payment->status === 'approved',
            'provider_invoice_id' => $payment->order?->id ?? null,
            'provider_payment_id' => (string) $paymentId,
            'status' => $payment->status,
        ];
    }

    private function runtimeEnvironment(): string
    {
        $useSandbox = filter_var(env('MERCADOPAGO_USE_SANDBOX', false), FILTER_VALIDATE_BOOL);

        return $useSandbox ? MercadoPagoConfig::LOCAL : MercadoPagoConfig::SERVER;
    }

    private function extractPaymentId(array $payload): string
    {
        $paymentId = $payload['data']['id'] ?? $payload['id'] ?? null;

        if (!$paymentId && isset($payload['resource'])) {
            $resource = $payload['resource'];
            $segments = explode('/', rtrim($resource, '/'));
            $paymentId = end($segments);
        }

        if (!$paymentId) {
            abort(422, 'Payment id not found.');
        }

        return (string) $paymentId;
    }

    private function extractInvoiceId(?string $externalReference): int
    {
        if (!$externalReference) {
            abort(422, 'External reference missing.');
        }

        if (!preg_match('/invoice:(\d+)/', $externalReference, $matches)) {
            abort(422, 'External reference inválida.');
        }

        return (int) $matches[1];
    }
}
