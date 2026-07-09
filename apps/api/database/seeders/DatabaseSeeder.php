<?php

namespace Database\Seeders;

use App\Models\Banco;
use App\Models\Empresa;
use App\Models\EmpresaSubscription;
use App\Models\Loja;
use App\Models\Produto;
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

        Banco::firstOrCreate(
            ['name' => 'Banco Dev'],
            ['ativo' => true],
        );

        Produto::firstOrCreate(
            ['name' => 'Produto Dev'],
            ['ativo' => true],
        );

        Regiao::firstOrCreate(
            ['name' => 'São Paulo/SP'],
            [
                'cidade' => 'São Paulo',
                'uf' => 'SP',
                'ativo' => true,
            ],
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
