<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;

class LeadPolicy extends BasePolicy
{
    public function listLoja(User $user): bool
    {
        return $user->role === User::ROLE_LOJA && $user->loja_id !== null;
    }

    public function viewLoja(User $user, Lead $lead): bool
    {
        if (!$this->sameEmpresa($user, $lead)) {
            return false;
        }

        return $user->role === User::ROLE_LOJA
            && $user->loja_id !== null
            && $user->loja_id === $lead->loja_id;
    }

    public function createLoja(User $user): bool
    {
        return $this->listLoja($user);
    }

    public function listInternal(User $user): bool
    {
        return in_array($user->role, [User::ROLE_ANALISTA, User::ROLE_GESTAO], true);
    }

    public function convert(User $user, Lead $lead): bool
    {
        if (!$this->sameEmpresa($user, $lead)) {
            return false;
        }

        return $this->listInternal($user);
    }
}
