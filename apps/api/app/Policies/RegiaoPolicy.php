<?php

namespace App\Policies;

use App\Models\User;

class RegiaoPolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === User::ROLE_GESTAO;
    }

    public function normalize(User $user): bool
    {
        return $user->role === User::ROLE_GESTAO;
    }
}
