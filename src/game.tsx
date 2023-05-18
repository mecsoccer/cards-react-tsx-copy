import { useState } from "react";
import {
  Card,
  CardRank,
  CardDeck,
  CardSuit,
  GameState,
  Hand,
  GameResult,
} from "./types";

//UI Elements
const CardBackImage = () => (
  <img src={process.env.PUBLIC_URL + `/SVG-cards/png/1x/back.png`} />
);

const CardImage = ({ suit, rank }: Card) => {
  const card = rank === CardRank.Ace ? 1 : rank;
  return (
    <img
      src={
        process.env.PUBLIC_URL +
        `/SVG-cards/png/1x/${suit.slice(0, -1)}_${card}.png`
      }
    />
  );
};

//Setup
const newCardDeck = (): CardDeck =>
  Object.values(CardSuit)
    .map((suit) =>
      Object.values(CardRank).map((rank) => ({
        suit,
        rank,
      }))
    )
    .reduce((a, v) => [...a, ...v]);

const shuffle = (deck: CardDeck): CardDeck => {
  return deck.sort(() => Math.random() - 0.5);
};

const takeCard = (deck: CardDeck): { card: Card; remaining: CardDeck } => {
  const card = deck[deck.length - 1];
  const remaining = deck.slice(0, deck.length - 1);
  return { card, remaining };
};

const setupGame = (): GameState => {
  const cardDeck = shuffle(newCardDeck());
  return {
    playerHand: cardDeck.slice(cardDeck.length - 2, cardDeck.length),
    dealerHand: cardDeck.slice(cardDeck.length - 4, cardDeck.length - 2),
    cardDeck: cardDeck.slice(0, cardDeck.length - 4), // remaining cards after player and dealer have been give theirs
    turn: "player_turn",
  };
};

//Scoring
const scoreMap = {
  [CardRank.Ace]: 11,
  [CardRank.Two]: 2,
  [CardRank.Three]: 3, 
  [CardRank.Four]: 4, 
  [CardRank.Five]: 5, 
  [CardRank.Six]: 6, 
  [CardRank.Seven]: 7, 
  [CardRank.Eight]: 8, 
  [CardRank.Nine]: 9, 
  [CardRank.Ten]: 10,
  [CardRank.Jack]: 10,
  [CardRank.Queen]: 10,
  [CardRank.King]: 10
}

const calculateHandScore = (hand: Hand): number => {
  let result = 0
  if (hand.find(card => card.rank === CardRank.Ace)) {
    let max = hand.reduce((a, b) => a + scoreMap[b.rank], 0)
    const aceCount = hand.filter(card => card.rank === CardRank.Ace).length
    if (max > 21) {
      for (let i = 0; i < aceCount; i++) {
        max -= 10
        if (max <= 21) break
      }
    }
    result = max
  } else {
    result = hand.reduce((a, b) => a + scoreMap[b.rank], 0)
  }
  return result;
};

const determineGameResult = (state: GameState): GameResult => {
  const { playerHand, dealerHand } = state
  const playerHandScore = calculateHandScore(playerHand)
  const dealerHandScore = calculateHandScore(dealerHand)
  const playerHasJack = playerHand.find((hand) => hand.rank === CardRank.King && hand.suit === CardSuit.Clubs)
  const dealerHasJack = dealerHand.find((hand) => hand.rank === CardRank.King && hand.suit === CardSuit.Clubs)
  if (playerHasJack && !dealerHasJack) return 'player_win'
  if (playerHasJack && dealerHasJack) return 'draw'
  if (playerHandScore > 21 && dealerHandScore <= 21) return 'dealer_win'
  if (playerHandScore <= 21 && dealerHandScore > 21) return 'player_win'
  if (playerHandScore > dealerHandScore) return 'player_win'
  if (playerHandScore < dealerHandScore) return 'dealer_win'
  if (playerHandScore === dealerHandScore) return 'draw'
  return "no_result";
};

//Player Actions
const playerStands = (state: GameState): GameState => {
  const { dealerHand } = state
  const dealerHandScore = calculateHandScore(dealerHand)
  let cardStatus = (dealerHandScore <= 16) && takeCard(state.cardDeck);
  let obj = {
    ...state,
    turn: "dealer_turn",
  };
  if (cardStatus) {
    obj['dealerHand'] = [...dealerHand, cardStatus.card]
    obj['cardDeck'] = cardStatus.remaining
  }
  return obj as GameState
};

const playerHits = (state: GameState): GameState => {
  const { card, remaining } = takeCard(state.cardDeck);
  return {
    ...state,
    cardDeck: remaining,
    playerHand: [...state.playerHand, card],
  };
};

//UI Component
const Game = (): JSX.Element => {
  const [state, setState] = useState(setupGame());

  return (
    <>
      <div>
        <p>There are {state.cardDeck.length} cards left in deck</p>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerHits)}
        >
          Hit
        </button>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerStands)}
        >
          Stand
        </button>
        <button onClick={(): void => setState(setupGame())}>Reset</button>
      </div>
      <p>Player Cards</p>
      <div>
        {state.playerHand.map(CardImage)}
        <p>Player Score {calculateHandScore(state.playerHand)}</p>
      </div>
      <p>Dealer Cards</p>
      {state.turn === "player_turn" && state.dealerHand.length > 0 ? (
        <div>
          <CardBackImage />
          <CardImage {...state.dealerHand[1]} />
        </div>
      ) : (
        <div>
          {state.dealerHand.map(CardImage)}
          <p>Dealer Score {calculateHandScore(state.dealerHand)}</p>
        </div>
      )}
      {state.turn === "dealer_turn" &&
      determineGameResult(state) != "no_result" ? (
        <p>{determineGameResult(state)}</p>
      ) : (
        <p>{state.turn}</p>
      )}
    </>
  );
};

export {
  Game,
  playerHits,
  playerStands,
  determineGameResult,
  calculateHandScore,
  setupGame,
};
