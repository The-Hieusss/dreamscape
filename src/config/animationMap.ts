// filepath: src/config/animationMap.ts

export const animationMap: Record<string, Record<string, string>> = {
  "T-Rex": {
    Idle: "TRex_Idle",
    Walk: "TRex_Walk",
    Run: "TRex_Run",
    Attack: "TRex_Attack",
    Death: "TRex_Death",
    Jump: "TRex_Jump",
  },

  Horse: {
    Idle: "Idle",
    Walk: "Walk",
    Run: "Gallop",            // locomotion clip
    Attack: "Attack_Kick",    // alternative: "Attack_Headbutt"
    Death: "Death",
    Jump: "Gallop_Jump",
  },

  Cow: {
    Idle: "Idle",
    Walk: "Walk",
    Run: "Gallop",            // Quaternius gives cows "Gallop"
    Attack: "Attack_Headbutt",
    Death: "Death",
    Eating: "Eating",
  },

  Sheep: {
    Idle: "Idle",
    Walk: "Walk",
    Run: "Gallop",
    Attack: "Attack_Headbutt",
    Death: "Death",
    Eating: "Eating",
  },

  Dog: {
    Idle: "Idle",
    Walk: "Walk",
    Run: "Gallop",
    Attack: "Attack_Bite",
    Death: "Death",
    Jump: "Jump",
  },

  Farmer: {
    Idle: "Idle",
    Walk: "Walk",
    Run: "Run",
    Attack: "Attack",         // may be generic punch
    Death: "Death",
    Wave: "Wave",             // emote
  },

  Adventurer: {
    Idle: "Idle",
    Walk: "Walk",
    Run: "Run",
    Attack: "Attack",
    Death: "Death",
    Jump: "Jump",
  },
};
