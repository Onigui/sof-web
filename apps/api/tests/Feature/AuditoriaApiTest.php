<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Empresa;
use App\Models\Proposta;
use App\Models\Produto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuditoriaApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_gestao_lista_auditoria_da_empresa(): void
    {
        $empresa = Empresa::factory()->create();
        $outraEmpresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_GESTAO,
        ]);

        $propostaEmpresa = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $gestao->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente 1',
            'cliente_cpf' => '12345678900',
            'cliente_celular' => '11999999999',
        ]);

        $propostaOutra = Proposta::create([
            'empresa_id' => $outraEmpresa->id,
            'operador_id' => User::factory()->create(['empresa_id' => $outraEmpresa->id])->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Sul',
            'cliente_nome' => 'Cliente 2',
            'cliente_cpf' => '98765432100',
            'cliente_celular' => '11988887777',
        ]);

        AuditLog::create([
            'empresa_id' => $empresa->id,
            'actor_user_id' => $gestao->id,
            'actor_role' => $gestao->role,
            'action' => 'PROPOSTA_CRIADA',
            'entity_type' => Proposta::class,
            'entity_id' => (string) $propostaEmpresa->id,
            'created_at' => now(),
        ]);

        AuditLog::create([
            'empresa_id' => $outraEmpresa->id,
            'actor_user_id' => $propostaOutra->operador_id,
            'actor_role' => User::ROLE_OPERADOR,
            'action' => 'PROPOSTA_CRIADA',
            'entity_type' => Proposta::class,
            'entity_id' => (string) $propostaOutra->id,
            'created_at' => now(),
        ]);

        Sanctum::actingAs($gestao);

        $response = $this->getJson('/api/v1/auditoria');

        $response->assertOk();
        $response->assertJsonCount(1, 'data.data');
        $response->assertJsonFragment([
            'entity_id' => (string) $propostaEmpresa->id,
            'action' => 'PROPOSTA_CRIADA',
        ]);
    }

    public function test_operador_visualiza_auditoria_da_proposta(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $operador = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $operador->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente 3',
            'cliente_cpf' => '12312312399',
            'cliente_celular' => '11977776666',
        ]);

        AuditLog::create([
            'empresa_id' => $empresa->id,
            'actor_user_id' => $operador->id,
            'actor_role' => $operador->role,
            'action' => 'PROPOSTA_ENVIADA',
            'entity_type' => Proposta::class,
            'entity_id' => (string) $proposta->id,
            'created_at' => now(),
        ]);

        Sanctum::actingAs($operador);

        $response = $this->getJson('/api/v1/auditoria?proposta_id=' . $proposta->id);

        $response->assertOk();
        $response->assertJsonFragment([
            'entity_id' => (string) $proposta->id,
            'action' => 'PROPOSTA_ENVIADA',
        ]);
    }

    public function test_operador_nao_visualiza_auditoria_de_outro_operador(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $operador = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);
        $outroOperador = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $outroOperador->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente 4',
            'cliente_cpf' => '32132132100',
            'cliente_celular' => '11966665555',
        ]);

        AuditLog::create([
            'empresa_id' => $empresa->id,
            'actor_user_id' => $outroOperador->id,
            'actor_role' => $outroOperador->role,
            'action' => 'PROPOSTA_CRIADA',
            'entity_type' => Proposta::class,
            'entity_id' => (string) $proposta->id,
            'created_at' => now(),
        ]);

        Sanctum::actingAs($operador);

        $this->getJson('/api/v1/auditoria?proposta_id=' . $proposta->id)
            ->assertForbidden();
    }
}
