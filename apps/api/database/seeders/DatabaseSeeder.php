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

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $empresa = Empresa::create([
            'name' => 'Casa Senior (DEV)',
        ]);

        EmpresaSubscription::create([
            'empresa_id' => $empresa->id,
            'status' => EmpresaSubscription::STATUS_TRIAL,
            'trial_ends_at' => now()->addDays(14),
            'grace_days' => 0,
        ]);

        User::factory()->create([
            'empresa_id' => $empresa->id,
            'name' => 'Operador Dev',
            'email' => 'operador@casa-senior.dev',
            'role' => User::ROLE_OPERADOR,
        ]);

        User::factory()->create([
            'empresa_id' => $empresa->id,
            'name' => 'Analista Dev',
            'email' => 'analista@casa-senior.dev',
            'role' => User::ROLE_ANALISTA,
        ]);

        User::factory()->create([
            'empresa_id' => $empresa->id,
            'name' => 'Gestao Dev',
            'email' => 'gestao@casa-senior.dev',
            'role' => User::ROLE_GESTAO,
        ]);

        $loja = Loja::create([
            'name' => 'Loja Dev',
            'ativo' => true,
        ]);

        User::factory()->create([
            'empresa_id' => $empresa->id,
            'loja_id' => $loja->id,
            'name' => 'Loja Dev',
            'email' => 'loja@casa-senior.dev',
            'role' => User::ROLE_LOJA,
        ]);

        Banco::create(['name' => 'Banco Dev', 'ativo' => true]);
        Produto::create(['name' => 'Produto Dev', 'ativo' => true]);
        Regiao::create([
            'name' => 'São Paulo/SP',
            'cidade' => 'São Paulo',
            'uf' => 'SP',
            'ativo' => true,
        ]);

        RequirementRule::create([
            'empresa_id' => $empresa->id,
            'banco_id' => null,
            'produto_id' => null,
            'required_fields' => ['cliente_nome', 'cliente_cpf', 'cliente_celular'],
            'required_docs' => ['CNH', 'COMP_END', 'COMP_RENDA'],
            'active' => true,
        ]);
    }
}
