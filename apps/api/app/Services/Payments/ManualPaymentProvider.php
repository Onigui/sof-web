<?php

namespace App\Services\Payments;

use App\Models\BillingInvoice;
use Illuminate\Http\Request;

class ManualPaymentProvider implements PaymentProvider
{
    public function createCheckout(BillingInvoice $invoice): array
    {
        return [
            'provider_invoice_id' => (string) $invoice->id,
            'checkout_url' => "pix-manual://invoice/{$invoice->id}",
        ];
    }

    public function verifyWebhook(Request $request): array
    {
        $secret = env('MANUAL_WEBHOOK_SECRET');
        $signature = $request->header('X-Manual-Signature');

        if (!$secret || $signature !== $secret) {
            abort(401, 'Invalid signature');
        }

        $payload = $request->validate([
            'invoice_id' => ['required'],
            'paid' => ['required', 'boolean'],
        ]);

        return [
            'type' => 'invoice.payment',
            'invoice_ref' => (string) $payload['invoice_id'],
            'paid' => (bool) $payload['paid'],
            'provider_invoice_id' => (string) $payload['invoice_id'],
            'provider_payment_id' => null,
        ];
    }
}
