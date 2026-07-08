<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BillingInvoice;
use App\Models\BillingPaymentAttempt;
use App\Models\BillingWebhookEvent;
use App\Models\EmpresaSubscription;
use App\Services\Payments\PaymentProviderFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class BillingWebhookController extends Controller
{
    public function handle(Request $request, string $provider, PaymentProviderFactory $factory): JsonResponse
    {
        $payload = $request->all();
        $signature = $request->header('X-Manual-Signature');
        $receivedAt = now();
        $eventId = $payload['event_id'] ?? null;

        $event = $this->registerWebhook($provider, $eventId, $signature, $payload, $receivedAt);

        if ($event->status === BillingWebhookEvent::STATUS_PROCESSED) {
            return response()->json(['status' => 'ok']);
        }

        try {
            $gateway = $factory->make($provider);
            $normalized = $gateway->verifyWebhook($request);

            $invoice = BillingInvoice::find($normalized['invoice_ref']);

            if ($invoice) {
                if ($normalized['paid']) {
                    $invoice->update([
                        'status' => BillingInvoice::STATUS_PAID,
                        'paid_at' => now(),
                        'provider' => $provider,
                        'provider_invoice_id' => $normalized['provider_invoice_id'] ?? null,
                    ]);

                    $this->upsertAttempt($invoice, $provider, $normalized);

                    $this->activateSubscription($invoice->empresa_id);
                } else {
                    $invoice->update([
                        'status' => BillingInvoice::STATUS_FAILED,
                    ]);

                    $this->upsertAttempt($invoice, $provider, $normalized, BillingPaymentAttempt::STATUS_FAILED);
                }
            }

            $event->update([
                'status' => BillingWebhookEvent::STATUS_PROCESSED,
                'processed_at' => now(),
            ]);

            return response()->json(['status' => 'ok']);
        } catch (Throwable $exception) {
            $event->update([
                'status' => BillingWebhookEvent::STATUS_FAILED,
                'processed_at' => now(),
                'error' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }

    private function registerWebhook(
        string $provider,
        ?string $eventId,
        ?string $signature,
        array $payload,
        $receivedAt
    ): BillingWebhookEvent {
        if ($eventId) {
            return BillingWebhookEvent::firstOrCreate(
                [
                    'provider' => $provider,
                    'event_id' => $eventId,
                ],
                [
                    'signature' => $signature,
                    'payload' => $payload,
                    'received_at' => $receivedAt,
                    'status' => BillingWebhookEvent::STATUS_RECEIVED,
                ]
            );
        }

        return BillingWebhookEvent::create([
            'provider' => $provider,
            'event_id' => null,
            'signature' => $signature,
            'payload' => $payload,
            'received_at' => $receivedAt,
            'status' => BillingWebhookEvent::STATUS_RECEIVED,
        ]);
    }

    private function activateSubscription(int $empresaId): void
    {
        $subscription = EmpresaSubscription::firstOrCreate(
            ['empresa_id' => $empresaId],
            [
                'status' => EmpresaSubscription::STATUS_TRIAL,
                'trial_ends_at' => now()->addDays(14),
                'grace_days' => 0,
            ]
        );

        if ($subscription->status !== EmpresaSubscription::STATUS_ATIVA) {
            $subscription->status = EmpresaSubscription::STATUS_ATIVA;
        }

        if ($subscription->active_since === null) {
            $subscription->active_since = now();
        }

        $subscription->save();
    }

    private function upsertAttempt(
        BillingInvoice $invoice,
        string $provider,
        array $normalized,
        string $status = BillingPaymentAttempt::STATUS_CONFIRMED
    ): void {
        $providerPaymentId = $normalized['provider_payment_id'] ?? null;

        if (!$providerPaymentId) {
            return;
        }

        BillingPaymentAttempt::updateOrCreate(
            [
                'billing_invoice_id' => $invoice->id,
                'provider' => $provider,
                'provider_payment_id' => $providerPaymentId,
            ],
            [
                'empresa_id' => $invoice->empresa_id,
                'status' => $status,
                'checkout_url' => $invoice->provider_checkout_url,
            ]
        );
    }
}
