<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BillingInvoice extends Model
{
    use BelongsToEmpresa, HasFactory;

    public const STATUS_DRAFT = 'DRAFT';
    public const STATUS_OPEN = 'OPEN';
    public const STATUS_PAID = 'PAID';
    public const STATUS_VOID = 'VOID';
    public const STATUS_FAILED = 'FAILED';

    protected $fillable = [
        'empresa_id',
        'referencia_mes',
        'status',
        'currency',
        'monthly_fee_centavos',
        'variable_fee_centavos',
        'total_centavos',
        'due_date',
        'paid_at',
        'provider',
        'provider_invoice_id',
        'provider_checkout_url',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'monthly_fee_centavos' => 'integer',
            'variable_fee_centavos' => 'integer',
            'total_centavos' => 'integer',
            'due_date' => 'date',
            'paid_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(BillingPaymentAttempt::class);
    }
}
