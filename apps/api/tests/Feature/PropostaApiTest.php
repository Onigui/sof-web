<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Proposta;
use App\Models\Produto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PropostaApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_operador_cria_proposta_com_status_rascunho(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/propostas', [
            'cliente_nome' => 'Cliente Teste',
            'cliente_cpf' => '12345678900',
            'cliente_celular' => '11999999999',
            'produto_id' => $produto->id,
            'regiao_raw' => 'Zona Sul',
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('propostas', [
            'empresa_id' => $empresa->id,
            'operador_id' => $user->id,
            'status' => Proposta::STATUS_RASCUNHO,
        ]);
    }

    public function test_operador_de_outra_empresa_nao_acessa(): void
    {
        $empresaA = Empresa::factory()->create();
        $empresaB = Empresa::factory()->create();
        $produto = Produto::factory()->create();

        $userA = User::factory()->create([
            'empresa_id' => $empresaA->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresaB->id,
            'operador_id' => User::factory()->create(['empresa_id' => $empresaB->id])->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Zona Norte',
            'cliente_nome' => 'Outro Cliente',
            'cliente_cpf' => '98765432100',
            'cliente_celular' => '11988887777',
        ]);

        Sanctum::actingAs($userA);

        $this->getJson("/api/v1/propostas/{$proposta->id}")
            ->assertNotFound();
    }

    public function test_enviar_muda_status_e_seta_enviada_em(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $user->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente A',
            'cliente_cpf' => '12312312399',
            'cliente_celular' => '11977776666',
        ]);

        Sanctum::actingAs($user);

        $this->postJson("/api/v1/propostas/{$proposta->id}/enviar")
            ->assertOk();

        $this->assertDatabaseHas('propostas', [
            'id' => $proposta->id,
            'status' => Proposta::STATUS_ANALISE_PROMOTORA,
        ]);

        $this->assertNotNull($proposta->fresh()->enviada_em);
    }

    public function test_operador_nao_consegue_editar_apos_enviar(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $user->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_ANALISE_PROMOTORA,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente A',
            'cliente_cpf' => '12312312399',
            'cliente_celular' => '11977776666',
            'enviada_em' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->patchJson("/api/v1/propostas/{$proposta->id}", [
            'cliente_nome' => 'Nome Alterado',
        ])->assertForbidden();
    }
}
