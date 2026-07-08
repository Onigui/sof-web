<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Banco;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BancoController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Banco::query()->orderBy('name')->get()->map(fn (Banco $banco) => [
            'id' => $banco->id,
            'nome' => $banco->name,
            'ativo' => (bool) ($banco->ativo ?? true),
        ]);

        return response()->json(['data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'ativo' => ['nullable', 'boolean'],
        ]);

        $banco = Banco::create([
            'name' => $validated['nome'],
            'ativo' => $validated['ativo'] ?? true,
        ]);

        return response()->json([
            'data' => [
                'id' => $banco->id,
                'nome' => $banco->name,
                'ativo' => (bool) $banco->ativo,
            ],
        ], 201);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'integer', 'exists:bancos,id'],
            'nome' => ['sometimes', 'string', 'max:255'],
            'ativo' => ['sometimes', 'boolean'],
        ]);

        $banco = Banco::query()->findOrFail($validated['id']);

        if (array_key_exists('nome', $validated)) {
            $banco->name = $validated['nome'];
        }
        if (array_key_exists('ativo', $validated)) {
            $banco->ativo = $validated['ativo'];
        }
        $banco->save();

        return response()->json([
            'data' => [
                'id' => $banco->id,
                'nome' => $banco->name,
                'ativo' => (bool) $banco->ativo,
            ],
        ]);
    }
}
