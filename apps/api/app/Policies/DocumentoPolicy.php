<?php

namespace App\Policies;

use App\Models\Documento;
use App\Models\Proposta;
use App\Models\User;

class DocumentoPolicy extends BasePolicy
{
    public function view(User $user, Documento $documento): bool
    {
        if (!$this->sameEmpresa($user, $documento)) {
            return false;
        }

        $proposta = $documento->proposta;

        return $user->id === $proposta->operador_id
            || in_array($user->role, [User::ROLE_ANALISTA, User::ROLE_GESTAO], true);
    }

    public function upload(User $user, Proposta $proposta): bool
    {
        if ($user->empresa_id !== $proposta->empresa_id) {
            return false;
        }

        return $user->role === User::ROLE_GESTAO || $user->id === $proposta->operador_id;
    }

    public function validateDocumento(User $user, Documento $documento): bool
    {
        if (!$this->sameEmpresa($user, $documento)) {
            return false;
        }

        return in_array($user->role, [User::ROLE_ANALISTA, User::ROLE_GESTAO], true);
    }
}
