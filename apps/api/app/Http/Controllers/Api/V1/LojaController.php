<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Loja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LojaController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Loja::query()->orderBy('name')->get()->map(fn (Loja $loja) => [
            'id' => $loja->id,
            'nome' => $loja->name,
            'ativo' => (bool) ($loja->ativo ?? true),
        ]);

        return response()->json(['data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'ativo' => ['nullable', 'boolean'],
        ]);

        $loja = Loja::create([
            'name' => $validated['nome'],
            'ativo' => $validated['ativo'] ?? true,
        ]);

        return response()->json([
            'data' => [
                'id' => $loja->id,
                'nome' => $loja->name,
                'ativo' => (bool) $loja->ativo,
            ],
        ], 201);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'integer', 'exists:lojas,id'],
            'nome' => ['sometimes', 'string', 'max:255'],
            'ativo' => ['sometimes', 'boolean'],
        ]);

        $loja = Loja::query()->findOrFail($validated['id']);

        if (array_key_exists('nome', $validated)) {
            $loja->name = $validated['nome'];
        }
        if (array_key_exists('ativo', $validated)) {
            $loja->ativo = $validated['ativo'];
        }
        $loja->save();

        return response()->json([
            'data' => [
                'id' => $loja->id,
                'nome' => $loja->name,
                'ativo' => (bool) $loja->ativo,
            ],
        ]);
    }
}
