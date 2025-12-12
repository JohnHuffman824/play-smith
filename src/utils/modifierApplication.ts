interface Position {
  role: string
  x: number
  y: number
}

interface Formation {
  id: number
  name: string
  positions: Position[]
}

interface ModifierRules {
  role: string
  delta_x: number
  delta_y: number
}

interface ModifierOverride {
  formation_id: number
  override_rules: ModifierRules
}

interface Modifier {
  id: number
  name: string
  default_rules: ModifierRules
  overrides: ModifierOverride[]
}

export function getModifierRules(modifier: Modifier, formationId: number): ModifierRules {
  const override = modifier.overrides.find(o => o.formation_id === formationId)
  return override ? override.override_rules : modifier.default_rules
}

export function applyModifier(formation: Formation, modifier: Modifier): Formation {
  const rules = getModifierRules(modifier, formation.id)

  const modifiedPositions = formation.positions.map(pos => {
    if (pos.role === rules.role) {
      return {
        ...pos,
        x: pos.x + rules.delta_x,
        y: pos.y + rules.delta_y
      }
    }
    return pos
  })

  return {
    ...formation,
    positions: modifiedPositions
  }
}
