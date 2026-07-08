<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('empresa_id')
                ->after('id')
                ->constrained('empresas')
                ->cascadeOnDelete();
            $table->enum('role', [
                User::ROLE_OPERADOR,
                User::ROLE_ANALISTA,
                User::ROLE_GESTAO,
            ])->after('password')->default(User::ROLE_OPERADOR);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['empresa_id']);
            $table->dropColumn(['empresa_id', 'role']);
        });
    }
};
