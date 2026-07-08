<?php

namespace App\Policies;

use App\Models\RelatorioRun;
use App\Models\User;

class RelatorioRunPolicy extends BasePolicy
{
    public function view(User $user, RelatorioRun $relatorioRun): bool
    {
        if (!$this->sameEmpresa($user, $relatorioRun)) {
            return false;
        }

        return in_array($user->role, [User::ROLE_ANALISTA, User::ROLE_GESTAO], true);
    }
}
