<?php

namespace Tests\Feature;

use App\Models\Banco;
use App\Models\Empresa;
use App\Models\Loja;
use App\Models\Produto;
use App\Models\Proposta;
use App\Models\Regiao;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Maatwebsite\Excel\Facades\Excel;
use Tests\TestCase;

class RelatorioApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_analista_acessa_relatorios_json(): void
    {
        $empresa = Empresa::factory()->create();
        $data = Carbon::parse('2025-01-10');

        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        $produto = Produto::factory()->create();
        $banco = Banco::create(['name' => 'Banco A']);
        $loja = Loja::create(['name' => 'Loja A']);
        $regiao = Regiao::create(['name' => 'Região A']);

        $aprovada = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $user->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_APROVADA,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente A',
            'cliente_cpf' => '12312312399',
            'cliente_celular' => '11977776666',
            'aprovada_em' => $data,
        ]);

        $integrada = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $user->id,
            'produto_id' => $produto->id,
            'banco_id' => $banco->id,
            'loja_id' => $loja->id,
            'regiao_id' => $regiao->id,
            'status' => Proposta::STATUS_INTEGRADA,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente B',
            'cliente_cpf' => '98798798700',
            'cliente_celular' => '11911112222',
            'valor_financiado' => 1200.50,
            'veiculo_placa' => 'ABC1234',
            'veiculo_renavam' => '123456789',
            'integrada_em' => $data,
        ]);

        DB::table('integracoes')->insert([
            'empresa_id' => $empresa->id,
            'proposta_id' => $integrada->id,
            'data_averbacao' => $data->toDateString(),
            'contrato' => 'CTR-123',
            'repasse' => 800.00,
            'tabela' => 'TAB-1',
            'veiculo' => 'Carro A',
            'alienado' => false,
            'regiao_override' => null,
            'created_by' => $user->id,
            'created_at' => $data,
            'updated_at' => $data,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/relatorios/aprovadas?data='.$data->toDateString())
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'cliente' => $aprovada->cliente_nome,
            ]);

        $this->getJson('/api/v1/relatorios/integradas?data='.$data->toDateString())
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'CONTRATO' => 'CTR-123',
            ]);
    }

    public function test_operador_recebe_403(): void
    {
        $empresa = Empresa::factory()->create();
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/relatorios/aprovadas?data=2025-01-10')
            ->assertForbidden();
    }

    public function test_export_retorna_download_csv_xlsx(): void
    {
        Excel::fake();

        $empresa = Empresa::factory()->create();
        $data = '2025-01-10';
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        Sanctum::actingAs($user);

        $this->get('/api/v1/relatorios/aprovadas/export?data='.$data.'&format=xlsx')
            ->assertOk();

        Excel::assertDownloaded('aprovadas-'.$data.'.xlsx');

        $this->get('/api/v1/relatorios/integradas/export?data='.$data.'&format=csv')
            ->assertOk();

        Excel::assertDownloaded('integradas-'.$data.'.csv');
    }

    public function test_multi_tenant_nao_retornam_dados_de_outra_empresa(): void
    {
        $empresaA = Empresa::factory()->create();
        $empresaB = Empresa::factory()->create();
        $data = Carbon::parse('2025-01-10');
        $produto = Produto::factory()->create();

        $user = User::factory()->create([
            'empresa_id' => $empresaA->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        Proposta::create([
            'empresa_id' => $empresaB->id,
            'operador_id' => User::factory()->create(['empresa_id' => $empresaB->id])->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_APROVADA,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente B',
            'cliente_cpf' => '11111111111',
            'cliente_celular' => '11999990000',
            'aprovada_em' => $data,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/relatorios/aprovadas?data='.$data->toDateString())
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
