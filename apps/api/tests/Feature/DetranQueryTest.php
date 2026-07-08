<?php

namespace Tests\Feature;

use App\Models\DetranQuery;
use App\Models\Empresa;
use App\Models\Proposta;
use App\Models\Produto;
use App\Models\User;
use App\Services\DetranQueryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DetranQueryTest extends TestCase
{
    use RefreshDatabase;

    public function test_cache_hit_retorna_mesmo_registro(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $analista = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        $service = new DetranQueryService();
        $cacheKey = $service->makeCacheKey('ABC1234', '123456789');

        $query = DetranQuery::create([
            'empresa_id' => $empresa->id,
            'status' => DetranQuery::STATUS_CONCLUIDA,
            'placa' => 'ABC1234',
            'renavam' => '123456789',
            'requested_by' => $analista->id,
            'requested_at' => now()->subHour(),
            'processed_at' => now()->subMinutes(30),
            'cache_key' => $cacheKey,
            'cache_expires_at' => now()->addHour(),
        ]);

        Sanctum::actingAs($analista);

        $response = $this->postJson('/api/v1/detran/queries', [
            'placa' => 'ABC1234',
            'renavam' => '123456789',
        ]);

        $response->assertOk();
        $response->assertJsonFragment([
            'id' => $query->id,
        ]);
    }

    public function test_rate_limit_retornar_429_quando_excedido(): void
    {
        putenv('DETRAN_DAILY_LIMIT=1');

        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $analista = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        DetranQuery::create([
            'empresa_id' => $empresa->id,
            'status' => DetranQuery::STATUS_CONCLUIDA,
            'placa' => 'ABC1234',
            'renavam' => '123456789',
            'requested_by' => $analista->id,
            'requested_at' => now(),
            'processed_at' => now(),
            'cache_key' => 'ABC1234|123456789',
            'cache_expires_at' => now()->subHour(),
        ]);

        Sanctum::actingAs($analista);

        $response = $this->postJson('/api/v1/detran/queries', [
            'placa' => 'DEF5678',
            'renavam' => '987654321',
        ]);

        $response->assertStatus(429);
        $response->assertJsonFragment([
            'message' => 'detran_daily_limit',
        ]);
    }

    public function test_complete_manual_marca_status_e_processado(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $analista = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $analista->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente Teste',
            'cliente_cpf' => '39053344705',
            'cliente_celular' => '11999999999',
        ]);

        $query = DetranQuery::create([
            'empresa_id' => $empresa->id,
            'proposta_id' => $proposta->id,
            'status' => DetranQuery::STATUS_PENDENTE,
            'placa' => 'ABC1234',
            'renavam' => '123456789',
            'requested_by' => $analista->id,
            'requested_at' => now(),
            'cache_key' => 'ABC1234|123456789',
            'cache_expires_at' => now()->addHours(72),
        ]);

        Sanctum::actingAs($analista);

        $this->postJson("/api/v1/detran/queries/{$query->id}/complete-manual", [
            'result_text' => 'Consulta manual concluída.',
            'result_json' => ['status' => 'ok'],
        ])->assertOk();

        $query->refresh();

        $this->assertSame(DetranQuery::STATUS_MANUAL, $query->status);
        $this->assertNotNull($query->processed_at);
        $this->assertSame('Consulta manual concluída.', $query->result_text);
    }

    public function test_complete_manual_respeita_multi_tenant(): void
    {
        $empresa = Empresa::factory()->create();
        $outraEmpresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $analista = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);
        $analistaOutra = User::factory()->create([
            'empresa_id' => $outraEmpresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $analista->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente Teste',
            'cliente_cpf' => '39053344705',
            'cliente_celular' => '11999999999',
        ]);

        $query = DetranQuery::create([
            'empresa_id' => $empresa->id,
            'proposta_id' => $proposta->id,
            'status' => DetranQuery::STATUS_PENDENTE,
            'placa' => 'ABC1234',
            'renavam' => '123456789',
            'requested_by' => $analista->id,
            'requested_at' => now(),
            'cache_key' => 'ABC1234|123456789',
            'cache_expires_at' => now()->addHours(72),
        ]);

        Sanctum::actingAs($analistaOutra);

        $this->postJson("/api/v1/detran/queries/{$query->id}/complete-manual", [
            'result_text' => 'Consulta manual concluída.',
        ])->assertNotFound();
    }
}
