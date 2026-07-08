<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bancos', function (Blueprint $table) {
            $table->boolean('ativo')->default(true)->after('name');
        });

        Schema::table('lojas', function (Blueprint $table) {
            $table->boolean('ativo')->default(true)->after('name');
        });

        Schema::table('produtos', function (Blueprint $table) {
            $table->boolean('ativo')->default(true)->after('name');
        });

        Schema::table('regioes', function (Blueprint $table) {
            $table->string('cidade')->nullable()->after('name');
            $table->string('uf', 2)->nullable()->after('cidade');
            $table->boolean('ativo')->default(true)->after('uf');
        });

        Schema::create('dut_registros', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained()->cascadeOnDelete();
            $table->foreignId('proposta_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('PENDENTE');
            $table->date('prazo_data')->nullable();
            $table->string('comprovante_path')->nullable();
            $table->timestamp('concluido_em')->nullable();
            $table->timestamps();

            $table->unique('proposta_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dut_registros');

        Schema::table('regioes', function (Blueprint $table) {
            $table->dropColumn(['cidade', 'uf', 'ativo']);
        });

        Schema::table('produtos', function (Blueprint $table) {
            $table->dropColumn('ativo');
        });

        Schema::table('lojas', function (Blueprint $table) {
            $table->dropColumn('ativo');
        });

        Schema::table('bancos', function (Blueprint $table) {
            $table->dropColumn('ativo');
        });
    }
};
