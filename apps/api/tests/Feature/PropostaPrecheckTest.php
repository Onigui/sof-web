<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Proposta;
use App\Models\Produto;
use App\Models\RequirementRule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PropostaPrecheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_cpf_invalido_bloqueia_criacao(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/propostas', [
            'cliente_nome' => 'Cliente Teste',
            'cliente_cpf' => '12345678900',
            'cliente_celular' => '11999999999',
            'produto_id' => $produto->id,
            'regiao_raw' => 'Centro',
        ])->assertUnprocessable();
    }

    public function test_precheck_retorna_missing_docs(): void
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
            'cliente_nome' => 'Cliente Doc',
            'cliente_cpf' => '39053344705',
            'cliente_celular' => '11999999999',
        ]);

        RequirementRule::create([
            'empresa_id' => $empresa->id,
            'produto_id' => $produto->id,
            'required_fields' => ['cliente_nome', 'cliente_cpf'],
            'required_docs' => ['CNH'],
            'active' => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/v1/propostas/{$proposta->id}/precheck");

        $response->assertOk();
        $response->assertJsonFragment([
            'missing_docs' => ['CNH'],
        ]);
    }

    public function test_enviar_bloqueia_quando_faltam_docs_ou_campos(): void
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
            'cliente_nome' => null,
            'cliente_cpf' => null,
            'cliente_celular' => null,
        ]);

        RequirementRule::create([
            'empresa_id' => $empresa->id,
            'required_fields' => ['cliente_nome', 'cliente_cpf'],
            'required_docs' => ['CNH'],
            'active' => true,
        ]);

        Sanctum::actingAs($user);

        $this->postJson("/api/v1/propostas/{$proposta->id}/enviar")
            ->assertUnprocessable()
            ->assertJsonFragment([
                'missing_docs' => ['CNH'],
            ]);
    }

    public function test_precheck_respeita_multi_tenant(): void
    {
        $empresa = Empresa::factory()->create();
        $outraEmpresa = Empresa::factory()->create();
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
            'cliente_nome' => 'Cliente Multi',
            'cliente_cpf' => '39053344705',
            'cliente_celular' => '11999999999',
        ]);

        RequirementRule::create([
            'empresa_id' => $outraEmpresa->id,
            'required_fields' => ['cliente_nome', 'cliente_cpf'],
            'required_docs' => ['CNH'],
            'active' => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/v1/propostas/{$proposta->id}/precheck");

        $response->assertOk();
        $response->assertJsonFragment([
            'missing_docs' => [],
        ]);
    }
}
