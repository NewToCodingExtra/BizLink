<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Opportunity;
use App\Models\Poll;
use App\Services\PollService;
use Illuminate\Http\Request;

class PollController extends Controller
{
    public function __construct(private PollService $polls) {}

    public function store(Request $request, Conversation $conversation)
    {
        $this->assertParticipant($request, $conversation);

        $data = $request->validate([
            'question' => 'required|string|max:255',
            'options' => 'required|array|min:2|max:5',
            'options.*' => 'required|string|max:80',
            'closes_at' => 'nullable|date|after:now',
        ]);

        $poll = $this->polls->create($request->user(), $conversation, $data);

        return response()->json([
            'data' => $this->polls->payload($poll, $request->user()->id),
        ], 201);
    }

    public function vote(Request $request, Poll $poll)
    {
        $poll->load('conversation');
        $this->assertParticipant($request, $poll->conversation);

        $data = $request->validate([
            'option' => 'required|integer|min:0|max:4',
        ]);

        $poll = $this->polls->vote($request->user(), $poll, (int) $data['option']);

        return response()->json(['data' => $this->polls->payload($poll, $request->user()->id)]);
    }

    public function close(Request $request, Poll $poll)
    {
        $poll->load('conversation');
        $this->assertParticipant($request, $poll->conversation);

        $poll = $this->polls->close($request->user(), $poll);

        return response()->json(['data' => $this->polls->payload($poll, $request->user()->id)]);
    }

    private function assertParticipant(Request $request, Conversation $conversation): void
    {
        $user = $request->user();
        $isBuyer = (int) $conversation->user_id === (int) $user->id;
        $isSeller = false;
        if (!$isBuyer) {
            $ownerId = Opportunity::where('brand_id', $conversation->brand_id)->value('user_id')
                ?? \App\Models\Story::where('brand_id', $conversation->brand_id)->value('user_id');
            $isSeller = (int) $ownerId === (int) $user->id;
        }
        abort_unless($isBuyer || $isSeller, 403, 'Forbidden');
    }
}
