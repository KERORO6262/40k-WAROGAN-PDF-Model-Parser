import { parseArmy } from "../parser/unitParser.js";

export const parserFixtures = {
  morvennVahl: `Morvenn Vahl [170pts]
• Morvenn Vahl equipped with: Fidelis, Lance of illumination and Paragon missile launcher
Unit M T SV W LD OC
Morvenn Vahl 8" 7 2+ 8 6+ 3
Ranged Weapons Range A BS S AP D
Fidelis
[SUSTAINED HITS 1]
36" 3 2+ 6 -1 2
Paragon missile launcher - prioris 36" 2 2+ 9 -2 D6
Paragon missile launcher - sanctorum 36" D6 2+ 6 -1 2
Melee Weapons Range A WS S AP D
Lance of illumination - strike Melee 5 2+ 8 -3 3
Lance of illumination - sweep Melee 10 2+ 5 -1 1
Abilities Description
Core Abilities Leader
Abbess Sanctorum This unit can re-roll Hit rolls.
Righteous Repugnance This model improves melee attacks.
SUPREME COMMANDER If this model is in your army, it must be your Warlord.
Keywords: Vehicle, Walker, Character, Epic Hero, Imperium, Morvenn Vahl`,
  deathCult: `Death Cult Assassins [35pts]
• 2 Death Cult Assassins equipped with: Death Cult power blades
Unit M T SV W LD OC
Death Cult Assassins 7" 3 5+ 1 7+ 1
Melee Weapons Range A WS S AP D
Death Cult power blades
[PRECISION]
Melee 4 2+ 4 -2 1
Abilities Description
Core Abilities Infiltrators
Keywords: Infantry, Imperium, Death Cult Assassins`,
  rogueTrader: `Rogue Trader Entourage [105pts]
• Rogue Trader equipped with: Household pistol and Monomolecular cane-rapier
• Death Cult Assassin equipped with: Dartmask and Death cult power blade
• Lectro-Maester equipped with: Close combat weapon and Voltaic pistol
• Rejuvenat Adept equipped with: Close combat weapon, Healing serum and Laspistol
Unit M T SV W LD OC
Rogue Trader 6" 3 4+ 4 6+ 1
Other Models 6" 3 4+ 2 7+ 1
Ranged Weapons Range A BS S AP D
Household pistol 12" 1 3+ 4 0 1
Voltaic pistol 12" 1 4+ 5 -1 2
Laspistol 12" 1 4+ 3 0 1
Melee Weapons Range A WS S AP D
Monomolecular cane-rapier Melee 3 3+ 4 -1 1
Death cult power blade Melee 4 2+ 4 -2 1
Close combat weapon Melee 1 4+ 3 0 1
Abilities Description
Healing serum The bearer can restore wounds.
Warrant of Trade If your army includes one or more units with this ability, after both players have deployed thew armies, select up to D3 Imperium Battleline units from your army and redeploy them. When doing so, you can set those units up in Strategic Reserves, regardless of how many units are already in Strategic Reserves.
Keywords: All Models: Infantry, Grenades, Imperium, Voidfarers, Rogue Trader Entourage | ROGUE TRADER: Character`,
  novitiates: `Sisters Novitiate Squad [100pts]
• Novitiate Superior equipped with: Close combat weapon and Plasma pistol and power weapon
• 4 Sisters Novitiate equipped with: Autogun, Autopistol and Close combat weapon
• Sisters Novitiate equipped with: Autopistol, Close combat weapon and Sacred banner
• Sisters Novitiate equipped with: Autopistol, Close combat weapon and Simulacrum imperialis
• Sisters Novitiate equipped with: Autopistol, Close combat weapon and Ministorum flamer
• 2 Sisters Novitiate equipped with: Autopistol and Novitiate melee weapons
Unit M T SV W LD OC
Novitiate Superior 6" 3 3+ 1 7+ 2
Sisters Novitiate 6" 3 4+ 1 8+ 2
Ranged Weapons Range A BS S AP D
Plasma pistol - standard 12" 1 3+ 7 -2 1
Plasma pistol - supercharge 12" 1 3+ 8 -3 2
Autogun 24" 2 4+ 3 0 1
Autopistol 12" 1 4+ 3 0 1
Ministorum flamer 12" D6 N/A 5 0 1
Melee Weapons Range A WS S AP D
Close combat weapon Melee 1 4+ 3 0 1
Power weapon Melee 3 3+ 4 -2 1
Novitiate melee weapons Melee 2 4+ 4 0 1
Abilities Description
Sacred Banner You can re-roll Advance and Charge rolls made for the bearer's unit.
Simulacrum Imperialis The bearer has an improved Objective Control ability.
Keywords: Infantry, Grenades, Imperium, Sisters Novitiate Squad`,
  battleSistersSquad: `Battle Sisters Squad [100pts]
Sister Superior equipped with: Bolt pistol, Close combat weapon, Inferno pistol and Power weapon
6 Battle Sisters equipped with: Bolt pistol, Boltgun and Close combat weapon
Battle Sisters equipped with: Bolt pistol, Close combat weapon and Meltagun
Battle Sisters equipped with: Bolt pistol, Close combat weapon and Multi-melta
Battle Sisters equipped with: Bolt pistol, Close combat weapon and Simulacrum imperialis and
boltgun
Unit M T SV W LD OC
Battle Sisters Squad 6" 3 3+ 1 7+ 2
Ranged Weapons Range A BS S AP D
10 Bolt pistol 12" 1 3+ 4 0 1
[PISTOL]
Meltagun 12" 1 3+ 9 -4 D6
[MELTA 2]
Melee Weapons Range A WS S AP D
10 Close combat weapon Melee 1 4+ 3 0 1
Abilities Description
Invulnerable Save This unit has a 6+ invulnerable save.
Simulacrum Imperialis At the end of your Command phase, for each objective marker you control
that has one or more units from your army with this ability within range of it,
roll one D6: on a 4+, you gain 1 Miracle dice showing a value equal to that
result.
Cherub Once per battle, after this unit has performed an Act of Faith, you gain 1
Miracle dice.
Designer's Note Place a Cherub token next to the unit, removing it once the Cherub ability has
been used.
Defenders of the Faith At the end of your Command phase, if this unit is within range of an objective
marker you control, that objective marker remains under your control, even if
you have no models within range of it, until your opponent controls it at the
start or end of any turn.
Faction: Adepta Sororitas
Keywords: Infantry, Grenades, Battleline, Imperium, Battle Sisters Squad`,
  vindicare: `Vindicare Assassin [80pts]
• Vindicare Assassin equipped with: Exitus pistol, Exitus rifle and Vindicare combat knife
Unit M T SV W LD OC
Vindicare Assassin 6" 4 6+ 4 6+ 1
Ranged Weapons Range A BS S AP D
Exitus pistol
[DEVASTATING WOUNDS, IGNORES COVER, PISTOL,
PRECISION]
12" 3 2+ 6 -2 3
Exitus rifle
[DEVASTATING WOUNDS, IGNORES COVER, HEAVY,
PRECISION]
36" 1 2+ 7 -3 D3+3
Melee Weapons Range A WS S AP D
Vindicare combat knife Melee 4 2+ 4 0 1
Abilities Description
Stealth This unit has Stealth.
Keywords: Infantry, Character, Epic Hero, Imperium, Officio Assassinorum, Vindicare Assassin`,
  celestineMixedKeywords: `Saint Celestine [160pts]
??Saint Celestine (Warlord) equipped with: The Ardent Blade
??Geminae Superia equipped with: Power weapon
Unit M T SV W LD OC
Saint Celestine 12" 3 2+ 5 6+ 3
Geminae Superia 12" 3 2+ 2 7+ 1
Melee Weapons Range A WS S AP D
The Ardent Blade Melee 5 2+ 6 -3 2
Power weapon Melee 2 4+ 4 -2 1
Abilities Description
re-roll a Wound roll of 1. If such an attack targets an enemy unit that has destroyed one or more Adepta Sororitas units from your army during the battle, add 1 to the Hit roll and add 1 to the Wound roll as well.
Faction: Adepta Sororitas
Keywords: Infantry, Jump Pack, Fly, Grenades, Imperium, | SAINT CELESTINE: Character, Epic Hero,`
  ,
  retributorSplitLeaderLoadout: `Retributor Squad [125pts]
Retributor Superior
equipped with: Bolt pistol
4 Retributors equipped with: Heavy bolter and Close combat weapon
Unit M T SV W LD OC
Retributor Superior 6" 3 3+ 1 7+ 2
Retributors 6" 3 3+ 1 7+ 2
Ranged Weapons Range A BS S AP D
Bolt pistol 12" 1 3+ 4 0 1
Heavy bolter 36" 3 4+ 5 -1 2
Melee Weapons Range A WS S AP D
Close combat weapon Melee 1 4+ 3 0 1
Power weapon Melee 2 4+ 4 -2 1
Abilities Description
Keywords: Infantry, Grenades, Imperium, Retributor Squad`
  ,
  retributorSplitDesignersNote: `Retributor Squad [125pts]
Retributor Superior equipped with: Bolt pistol and Close combat weapon
4 Retributors equipped with: Heavy bolter and Close combat weapon
Unit M T SV W LD OC
Retributor Superior 6" 3 3+ 1 7+ 2
Retributors 6" 3 3+ 1 7+ 2
Ranged Weapons Range A BS S AP D
Bolt pistol 12" 1 3+ 4 0 1
Heavy bolter 36" 3 4+ 5 -1 2
Melee Weapons Range A WS S AP D
Close combat weapon Melee 1 4+ 3 0 1
Abilities Description
Designer's Note
Place two Cherub tokens next to the unit, removing one each time the Cherubs ability has been used.
Keywords: Infantry, Grenades, Imperium, Retributor Squad`
  ,
  diceProfileWeapons: `Dice Profile Test [100pts]
??Dice Profile Test equipped with: Variable cannon and Split profile launcher
Unit M T SV W LD OC
Dice Profile Test 6" 4 3+ 5 7+ 2
Ranged Weapons Range A BS S AP D
Variable cannon 48" D6+3 3+ 10 -1 3
[BLAST, IGNORES COVER]
Split profile launcher
[ONE SHOT]
36" 2D6 4+ 6 -2 D3+3
Abilities Description
Keywords: Infantry, Imperium, Dice Profile Test`
};

export const runParserFixtures = () => Object.fromEntries(
  Object.entries(parserFixtures).map(([name, text]) => [name, parseArmy(text, `${name}.txt`)])
);

export const runParserFixtureChecks = () => {
  const results = runParserFixtures();
  const weapons = results.diceProfileWeapons.units[0].weapons;
  const variableCannon = weapons.find((weapon) => weapon.name === "Variable cannon");
  const splitLauncher = weapons.find((weapon) => weapon.name === "Split profile launcher");
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };

  check(variableCannon?.attacks === "D6+3", "Expected same-line D6+3 attacks to parse.");
  check(variableCannon.rules.includes("BLAST") && variableCannon.rules.includes("IGNORES COVER"), "Expected same-line weapon rules to parse.");
  check(splitLauncher?.attacks === "2D6", "Expected split-line 2D6 attacks to parse.");
  check(splitLauncher?.damage === "D3+3", "Expected split-line D3+3 damage to parse.");
  check(splitLauncher.rules.includes("ONE SHOT"), "Expected split-line weapon rules to parse.");

  const battleSistersAbilities = results.battleSistersSquad.units[0].unitRules;
  const battleSistersAbilityNames = battleSistersAbilities.map((ability) => ability.name);
  ["Invulnerable Save", "Simulacrum Imperialis", "Cherub", "Designer's Note", "Defenders of the Faith"].forEach((name) => {
    check(battleSistersAbilityNames.includes(name), `Expected Battle Sisters ability "${name}" to parse separately.`);
  });
  check(
    battleSistersAbilities.find((ability) => ability.name === "Invulnerable Save")?.description === "This unit has a 6+ invulnerable save.",
    "Expected Invulnerable Save description not to consume later Battle Sisters abilities."
  );
  const battleSistersMatchedNames = results.battleSistersSquad.units[0].modelGroups[0].matchedAbilities.map((ability) => ability.name);
  ["Simulacrum Imperialis", "Designer's Note"].forEach((name) => {
    check(battleSistersMatchedNames.includes(name), `Expected Battle Sisters ability "${name}" to appear in model preview data.`);
  });
  const retributorSplitDesignersNote = results.retributorSplitDesignersNote.units[0];
  const retributorDesignersNote = retributorSplitDesignersNote.unitRules.find((ability) => ability.name === "Designer's Note");
  check(retributorDesignersNote?.description.startsWith("Place two Cherub tokens"), "Expected split-line Designer's Note description to parse.");
  check(
    retributorSplitDesignersNote.modelGroups.every((group) => group.matchedAbilities.some((ability) => ability.name === "Designer's Note")),
    "Expected split-line Designer's Note to apply to all Retributor model groups."
  );
  check(
    !retributorSplitDesignersNote.parseWarnings.some((warning) => warning.code === "ABILITY_SCOPE_UNKNOWN" && warning.message.includes("Designer's Note")),
    "Expected split-line Designer's Note not to emit an ability scope warning."
  );

  runEdition11ParserFixtures();
  return "ok";
};

if (typeof window !== "undefined") {
  window.runWaroganParserFixtures = runParserFixtures;
  window.runWaroganEdition11ParserFixtures = runEdition11ParserFixtures;
  window.runWaroganParserFixtureChecks = runParserFixtureChecks;
}
