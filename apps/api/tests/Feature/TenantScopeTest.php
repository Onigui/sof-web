<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_only_sees_users_from_same_empresa(): void
    {
        $empresaA = Empresa::factory()->create();
        $empresaB = Empresa::factory()->create();

        $userA = User::factory()->create([
            'empresa_id' => $empresaA->id,
            'role' => User::ROLE_ANALISTA,
        ]);
        $sameEmpresaUser = User::factory()->create([
            'empresa_id' => $empresaA->id,
        ]);
        $otherEmpresaUser = User::factory()->create([
            'empresa_id' => $empresaB->id,
        ]);

        $this->actingAs($userA);

        $visibleIds = User::query()->pluck('id');

        $this->assertTrue($visibleIds->contains($userA->id));
        $this->assertTrue($visibleIds->contains($sameEmpresaUser->id));
        $this->assertFalse($visibleIds->contains($otherEmpresaUser->id));
        $this->assertFalse(User::whereKey($otherEmpresaUser->id)->exists());
    }
}
