<?php

namespace App\Policies;

use App\Models\Proposta;
use App\Models\User;

class PropostaPolicy extends BasePolicy
{
    public function view(User $user, Proposta $proposta): bool
    {
        if (!$this->sameEmpresa($user, $proposta)) {
            return false;
        }

        return $user->id === $proposta->operador_id
            || in_array($user->role, [User::ROLE_ANALISTA, User::ROLE_GESTAO], true);
    }

    public function update(User $user, Proposta $proposta): bool
    {
        if (!$this->sameEmpresa($user, $proposta)) {
            return false;
        }

        if ($proposta->status !== Proposta::STATUS_RASCUNHO) {
            return false;
        }

        return $user->role === User::ROLE_GESTAO
            || $user->id === $proposta->operador_id;
    }

    public function enviar(User $user, Proposta $proposta): bool
    {
        if (!$this->sameEmpresa($user, $proposta)) {
            return false;
        }

        if ($user->role === User::ROLE_GESTAO) {
            return $proposta->status === Proposta::STATUS_RASCUNHO;
        }

        return $user->id === $proposta->operador_id
            && $proposta->status === Proposta::STATUS_RASCUNHO;
    }

    public function integrar(User $user, Proposta $proposta): bool
    {
        if (!$this->sameEmpresa($user, $proposta)) {
            return false;
        }

        if (!in_array($user->role, [User::ROLE_ANALISTA, User::ROLE_GESTAO], true)) {
            return false;
        }

        return !in_array($proposta->status, [
            Proposta::STATUS_RECUSADA,
            Proposta::STATUS_CANCELADA,
            Proposta::STATUS_INTEGRADA,
        ], true);
    }

    public function transferir(User $user, Proposta $proposta): bool
    {
        if (!$this->sameEmpresa($user, $proposta)) {
            return false;
        }

        return $user->role === User::ROLE_GESTAO;
    }

    public function ajustarStatus(User $user, Proposta $proposta): bool
    {
        if (!$this->sameEmpresa($user, $proposta)) {
            return false;
        }

        return $user->role === User::ROLE_GESTAO;
    }

    public function autoValidateDocumentos(User $user, Proposta $proposta): bool
    {
        if (!$this->sameEmpresa($user, $proposta)) {
            return false;
        }

        return in_array($user->role, [User::ROLE_ANALISTA, User::ROLE_GESTAO], true);
    }
}
