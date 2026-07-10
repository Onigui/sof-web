<?php

namespace Database\Seeders;

use App\Models\Banco;
use App\Models\Empresa;
use App\Models\EmpresaSubscription;
use App\Models\Lead;
use App\Models\Loja;
use App\Models\Produto;
use App\Models\Proposta;
use App\Models\Regiao;
use App\Models\RequirementRule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $empresa = Empresa::firstOrCreate(
            ['name' => 'Casa Senior (DEV)'],
        );

        EmpresaSubscription::updateOrCreate(
            ['empresa_id' => $empresa->id],
            [
                'status' => EmpresaSubscription::STATUS_TRIAL,
                'trial_ends_at' => now()->addDays(14),
                'grace_days' => 0,
            ]
        );

        $loja = Loja::firstOrCreate(
            ['name' => 'Loja Dev'],
            ['ativo' => true],
        );

        $users = [
            [
                'email' => 'operador@casa-senior.dev',
                'name' => 'Operador Dev',
                'role' => User::ROLE_OPERADOR,
                'loja_id' => null,
            ],
            [
                'email' => 'analista@casa-senior.dev',
                'name' => 'Analista Dev',
                'role' => User::ROLE_ANALISTA,
                'loja_id' => null,
            ],
            [
                'email' => 'gestao@casa-senior.dev',
                'name' => 'Gestao Dev',
                'role' => User::ROLE_GESTAO,
                'loja_id' => null,
            ],
            [
                'email' => 'loja@casa-senior.dev',
                'name' => 'Loja Dev',
                'role' => User::ROLE_LOJA,
                'loja_id' => $loja->id,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'empresa_id' => $empresa->id,
                    'name' => $userData['name'],
                    'role' => $userData['role'],
                    'loja_id' => $userData['loja_id'],
                    'password' => Hash::make('password'),
                ]
            );
        }

        $operador = User::where('email', 'operador@casa-senior.dev')->first();

        $banco = Banco::firstOrCreate(
            ['name' => 'Banco Dev'],
            ['ativo' => true],
        );

        $produto = Produto::firstOrCreate(
            ['name' => 'Produto Dev'],
            ['ativo' => true],
        );

        $regiao = Regiao::firstOrCreate(
            ['name' => 'São Paulo/SP'],
            [
                'cidade' => 'São Paulo',
                'uf' => 'SP',
                'ativo' => true,
            ],
        );

        if ($operador) {
            Proposta::firstOrCreate(
                [
                    'empresa_id' => $empresa->id,
                    'cliente_cpf' => '12345678909',
                ],
                [
                    'operador_id' => $operador->id,
                    'loja_id' => $loja->id,
                    'regiao_raw' => $regiao->name,
                    'regiao_id' => $regiao->id,
                    'banco_id' => $banco->id,
                    'produto_id' => $produto->id,
                    'status' => Proposta::STATUS_RASCUNHO,
                    'prioridade' => Proposta::PRIORIDADE_NORMAL,
                    'cliente_nome' => 'Maria Silva (demo)',
                    'cliente_celular' => '11999990000',
                    'cliente_email' => 'maria.demo@casa-senior.dev',
                    'veiculo_placa' => 'ABC1D23',
                    'veiculo_descricao' => 'Fiat Argo 1.0 2022',
                    'valor_veiculo' => 65000,
                    'valor_financiado' => 45000,
                ]
            );
        }

        Lead::firstOrCreate(
            [
                'empresa_id' => $empresa->id,
                'cliente_celular' => '11988887777',
            ],
            [
                'loja_id' => $loja->id,
                'status' => Lead::STATUS_NOVO,
                'cliente_nome' => 'João Santos (demo)',
                'cliente_cpf' => '98765432100',
                'placa' => 'XYZ9A87',
                'descricao' => 'Interesse em financiar HB20 2021',
                'valor_veiculo' => 72000,
                'entrada' => 15000,
                'valor_solicitado' => 57000,
                'banco_id' => $banco->id,
                'produto_id' => $produto->id,
            ]
        );

        RequirementRule::updateOrCreate(
            [
                'empresa_id' => $empresa->id,
                'banco_id' => null,
                'produto_id' => null,
            ],
            [
                'required_fields' => ['cliente_nome', 'cliente_cpf', 'cliente_celular'],
                'required_docs' => ['CNH', 'COMP_END', 'COMP_RENDA'],
                'active' => true,
            ]
        );
    }
}
