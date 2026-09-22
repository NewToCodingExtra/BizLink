<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FollowController extends Controller
{
    public function toggle(Request $request)
    {
        $data = $request->validate(['brand_id' => 'required|string|max:255']);
        $exists = DB::table('follows')->where('user_id', $request->user()->id)->where('brand_id', $data['brand_id'])->exists();
        if ($exists) {
            DB::table('follows')->where('user_id', $request->user()->id)->where('brand_id', $data['brand_id'])->delete();
            return response()->json(['following' => false]);
        }
        DB::table('follows')->insert([
            'user_id' => $request->user()->id,
            'brand_id' => $data['brand_id'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['following' => true]);
    }

    public function index(Request $request)
    {
        $brands = DB::table('follows')->where('user_id', $request->user()->id)->pluck('brand_id');
        return response()->json(['data' => $brands]);
    }
}
