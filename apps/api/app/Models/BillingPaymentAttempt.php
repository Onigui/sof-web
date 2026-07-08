<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillingPaymentAttempt extends Model
{
    use BelongsToEmpresa, HasFactory;

    public const STATUS_CREATED = 'CREATED';
    public const STATUS_REDIRECTED = 'REDIRECTED';
    public const STATUS_CONFIRMED = 'CONFIRMED';
    public const STATUS_FAILED = 'FAILED';

    protected $fillable = [
        'empresa_id',
        'billing_invoice_id',
        'provider',
        'status',
        'provider_payment_id',
        'checkout_url',
        'last_error',
        'created_by',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(BillingInvoice::class, 'billing_invoice_id');
    }

    public function criadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
