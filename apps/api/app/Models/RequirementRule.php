<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RequirementRule extends Model
{
    use BelongsToEmpresa, HasFactory;

    protected $fillable = [
        'empresa_id',
        'banco_id',
        'produto_id',
        'required_fields',
        'required_docs',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'required_fields' => 'array',
            'required_docs' => 'array',
            'active' => 'boolean',
        ];
    }
}
