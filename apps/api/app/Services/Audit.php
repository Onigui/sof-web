<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class Audit
{
    public static function log(
        string $action,
        string $entityType,
        string $entityId,
        array $metadata = [],
        ?User $actorUser = null,
        ?Request $request = null
    ): AuditLog {
        return AuditLog::create([
            'empresa_id' => $actorUser?->empresa_id ?? $metadata['empresa_id'] ?? null,
            'actor_user_id' => $actorUser?->id,
            'actor_role' => $actorUser?->role,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'metadata' => $metadata ?: null,
            'ip' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'created_at' => now(),
        ]);
    }
}
