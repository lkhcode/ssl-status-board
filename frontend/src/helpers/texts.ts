import { Referee_Stage, Referee_Command } from '@/proto/ssl_gc_referee_message_pb'
import { Team } from '@/proto/ssl_gc_common_pb'
import {
  type GameEvent,
  type GameEvent_BotCrashDrawn,
  type GameEvent_BotCrashUnique,
} from '@/proto/ssl_gc_game_event_pb'

const stageToText = new Map<Referee_Stage, string>([
  [Referee_Stage.NORMAL_FIRST_HALF_PRE, '比赛准备阶段'],
  [Referee_Stage.NORMAL_FIRST_HALF, '上半场'],
  [Referee_Stage.NORMAL_HALF_TIME, '中场休息'],
  [Referee_Stage.NORMAL_SECOND_HALF_PRE, '下半场准备'],
  [Referee_Stage.NORMAL_SECOND_HALF, '下半场'],
  [Referee_Stage.EXTRA_TIME_BREAK, '加时赛休息'],
  [Referee_Stage.EXTRA_FIRST_HALF_PRE, '上半场（加时赛）准备'],
  [Referee_Stage.EXTRA_FIRST_HALF, '上半场（加时赛）'],
  [Referee_Stage.EXTRA_HALF_TIME, '中场休息（加时赛）'],
  [Referee_Stage.EXTRA_SECOND_HALF_PRE, '下半场（加时赛）准备'],
  [Referee_Stage.EXTRA_SECOND_HALF, '下半场（加时赛）'],
  [Referee_Stage.PENALTY_SHOOTOUT_BREAK, '点球大战准备'],
  [Referee_Stage.PENALTY_SHOOTOUT, '点球大战'],
  [Referee_Stage.POST_GAME, '比赛结束'],
])

export const mapStageToText = (stage: Referee_Stage): string => {
  const text = stageToText.get(stage)
  if (text !== undefined) {
    return text
  }
  return `未知的比赛阶段: ${stage}`
}

const commandToText = new Map<Referee_Command, string>([
  [Referee_Command.HALT, 'Game Halt'],
  [Referee_Command.STOP, 'Stop Game'],
  [Referee_Command.NORMAL_START, 'Normal Start'],
  [Referee_Command.FORCE_START, 'Force Start'],
  [Referee_Command.PREPARE_KICKOFF_YELLOW, 'Kickoff'],
  [Referee_Command.PREPARE_KICKOFF_BLUE, 'Kickoff'],
  [Referee_Command.PREPARE_PENALTY_YELLOW, 'Penalty Kick'],
  [Referee_Command.PREPARE_PENALTY_BLUE, 'Penalty Kick'],
  [Referee_Command.DIRECT_FREE_YELLOW, 'Direct Kick'],
  [Referee_Command.DIRECT_FREE_BLUE, 'Direct Kick'],
  [Referee_Command.INDIRECT_FREE_YELLOW, 'Indirect Kick'],
  [Referee_Command.INDIRECT_FREE_BLUE, 'Indirect Kick'],
  [Referee_Command.TIMEOUT_YELLOW, 'Timeout'],
  [Referee_Command.TIMEOUT_BLUE, 'Timeout'],
  [Referee_Command.GOAL_YELLOW, 'Goal'],
  [Referee_Command.GOAL_BLUE, 'Goal'],
  [Referee_Command.BALL_PLACEMENT_YELLOW, 'Ball Placement'],
  [Referee_Command.BALL_PLACEMENT_BLUE, 'Ball Placement'],
])

export const mapCommandToText = (command: Referee_Command): string => {
  const text = commandToText.get(command)
  if (text !== undefined) {
    return text
  }
  return `未知命令: ${command}`
}

const oppositeTeam = (team: Team): Team => {
  if (team === Team.BLUE) {
    return Team.YELLOW
  } else if (team === Team.YELLOW) {
    return Team.BLUE
  }
  return Team.UNKNOWN
}

const formatTeam = (team: Team): string => {
  if (team === Team.BLUE) {
    return '<span class="team-blue">Blue</span>'
  } else if (team === Team.YELLOW) {
    return '<span class="team-yellow">Yellow</span>'
  }
  return 'Unknown'
}

const teamAndBot = (event: { byTeam?: Team; byBot?: number }): string => {
  if (event.byTeam === undefined) {
    return ''
  }
  if (event.byBot === undefined || !event.hasOwnProperty('byBot')) {
    return formatTeam(event.byTeam)
  }
  return formatTeam(event.byTeam) + ' ' + event.byBot
}

const radToDeg = (rad: number): string => {
  return Math.ceil((rad * 180) / Math.PI) + '°'
}

const velocity = (v: number): string => {
  return Number(Math.ceil(v * 10) / 10).toFixed(1) + 'm/s'
}

const distance = (v: number): string => {
  return Number(Math.ceil(v * 100) / 100).toFixed(2) + 'm'
}

const seconds = (v: number): string => {
  return Number(Math.ceil(v * 10) / 10).toFixed(1) + 's'
}

function appendCrashDetails(
  event: GameEvent_BotCrashDrawn | GameEvent_BotCrashUnique,
  text: string,
) {
  const crashSpeed = event.crashSpeed
  const crashAngle = event.crashAngle
  const speedDiff = event.speedDiff
  if (crashSpeed > 0) {
    text += ` with ${velocity(crashSpeed)}`
  }
  if (crashAngle > 0) {
    text += ` @ ${radToDeg(crashAngle)}`
  }
  if (speedDiff > 0) {
    text += ` (Δ ${velocity(speedDiff)})`
  }
  return text
}

export const mapGameEventToText = (gameEvent: GameEvent): string => {
  if (!gameEvent.event) {
    return '无法识别的比赛事件'
  }

  switch (gameEvent.event.case) {
    case 'noProgressInGame':
      return `${seconds(gameEvent.event.value.time)}内无进展`
    case 'placementFailed': {
      const event = gameEvent.event.value
      if (event.nearestOwnBotDistance != null) {
        return (
          `${teamAndBot(event)} 放球失败 ` +
          ` (剩余${distance(event.remainingDistance)}，` +
          `最近己方机器人距离${distance(event.nearestOwnBotDistance)})`
        )
      }
      return (
        `${teamAndBot(event)} 放球失败 ` +
        ` (剩余${distance(event.remainingDistance)})`
      )
    }
    case 'placementSucceeded': {
      const event = gameEvent.event.value
      return (
        `${teamAndBot(event)} 成功放球 ` +
        `距离${distance(event.distance)} ` +
        `耗时${seconds(event.timeTaken)} ` +
        `精度${distance(event.precision)}`
      )
    }
    case 'botSubstitution':
      return `${teamAndBot(gameEvent.event.value)} 进行机器人更换`
    case 'excessiveBotSubstitution':
      return `${teamAndBot(gameEvent.event.value)} 更换机器人次数过多`
    case 'tooManyRobots': {
      const event = gameEvent.event.value
      return (
        `${teamAndBot(event)} 场上有${event.numRobotsOnField}个机器人，` +
        `但只允许存在${event.numRobotsAllowed}个`
      )
    }
    case 'ballLeftFieldTouchLine':
      return `${teamAndBot(gameEvent.event.value)} 将球踢出边线`
    case 'ballLeftFieldGoalLine':
      return `${teamAndBot(gameEvent.event.value)} 将球踢出底线`
    case 'possibleGoal':
      return `${teamAndBot(gameEvent.event.value)} 存在待确认的进球`
    case 'goal':
      return `${teamAndBot(gameEvent.event.value)} 进球有效`
    case 'invalidGoal': {
      const event = gameEvent.event.value
      return `${teamAndBot(event)} 进球无效：${event.message}`
    }
    case 'aimlessKick':
      return `${teamAndBot(gameEvent.event.value)} 无意义射门`
    case 'keeperHeldBall': {
      const event = gameEvent.event.value
      return `${teamAndBot(event)} 守门员清球超时${seconds(event.duration)}`
    }
    case 'attackerDoubleTouchedBall':
      return `${teamAndBot(gameEvent.event.value)} 二次触球`
    case 'attackerTouchedBallInDefenseArea':
      return `${teamAndBot(gameEvent.event.value)} 在对方禁区触球`
    case 'botDribbledBallTooFar':
      return `${teamAndBot(gameEvent.event.value)} 带球过度`
    case 'botKickedBallTooFast': {
      const event = gameEvent.event.value
      return `${teamAndBot(event)} 踢球速度过快(${velocity(event.initialBallSpeed)})`
    }
    case 'attackerTooCloseToDefenseArea': {
      const event = gameEvent.event.value
      return `${teamAndBot(event)} 距离对方禁区过近(${distance(event.distance)})`
    }
    case 'botInterferedPlacement':
      return `${teamAndBot(gameEvent.event.value)} 干扰放球`
    case 'botCrashDrawn': {
      const event = gameEvent.event.value
      const text = `蓝队机器人${event.botBlue}和黄队机器人${event.botYellow}碰撞`
      return appendCrashDetails(event, text)
    }
    case 'botCrashUnique': {
      const event = gameEvent.event.value
      const byTeam = event.byTeam
      const otherTeam = oppositeTeam(byTeam)
      const violator = event.violator
      const victim = event.victim
      const text = `${formatTeam(byTeam)} ${violator} 撞向 ${formatTeam(otherTeam)} ${victim}`
      return appendCrashDetails(event, text)
    }
    case 'botPushedBot': {
      const event = gameEvent.event.value
      const byTeam = event.byTeam
      const otherTeam = oppositeTeam(byTeam)
      const violator = event.violator
      const victim = event.victim
      const dist = event.pushedDistance
      let text = `${formatTeam(byTeam)} ${violator} 推挤 ${formatTeam(otherTeam)} ${victim}`
      if (dist > 0) {
        text += ` 距离${distance(dist)}`
      }
      return text
    }
    case 'botHeldBallDeliberately': {
      const event = gameEvent.event.value
      return `${teamAndBot(event)} 护球 ${event.duration} s`
    }
    case 'botTippedOver':
      return `${teamAndBot(gameEvent.event.value)} 翻倒`
    case 'botDroppedParts':
      return `${teamAndBot(gameEvent.event.value)} 掉落部件`
    case 'botTooFastInStop': {
      const event = gameEvent.event.value
      return `${teamAndBot(event)} 在停止阶段超速(${velocity(event.speed)})`
    }
    case 'defenderTooCloseToKickPoint': {
      const event = gameEvent.event.value
      return `${teamAndBot(event)} 距离开球点过近(${distance(event.distance)})`
    }
    case 'defenderInDefenseArea': {
      const event = gameEvent.event.value
      return `${teamAndBot(event)} 完全进入己方禁区触球(${distance(event.distance)})`
    }
    case 'multipleCards':
      return `${teamAndBot(gameEvent.event.value)} 累计受牌`
    case 'multipleFouls': {
      const event = gameEvent.event.value
      return (
        `${teamAndBot(event)} 累计多次犯规：` +
        event.causedGameEvents.map((cause: GameEvent) => mapGameEventToText(cause)).join('，')
      )
    }
    case 'unsportingBehaviorMinor': {
      const event = gameEvent.event.value
      return `${teamAndBot(event)} 轻微的违反体育精神的行为：${event.reason}`
    }
    case 'unsportingBehaviorMajor': {
      const event = gameEvent.event.value
      return `${teamAndBot(event)} 严重的违反体育精神的行为：${event.reason}`
    }
    case 'boundaryCrossing':
      return `${teamAndBot(gameEvent.event.value)} 将球踢出场地边界`
    case 'penaltyKickFailed': {
      const event = gameEvent.event.value
      const reason = event.reason != null ? '：' + event.reason : ''
      return `${teamAndBot(event)} 点球失败${reason}`
    }
    case 'challengeFlag':
      return `${teamAndBot(gameEvent.event.value)} 提出质疑`
    case 'challengeFlagHandled': {
      const event = gameEvent.event.value
      if (event.accepted) {
        return `${teamAndBot(event)} 的质疑被接受`
      }
      return `${teamAndBot(event)} 的质疑被驳回`
    }
    case 'emergencyStop':
      return `${teamAndBot(gameEvent.event.value)} 发出紧急停止信号`
    case 'attackerTouchedOpponentInDefenseArea' :
      return `${teamAndBot(gameEvent.event.value)} 在对方禁区触碰对方机器人`
    case 'defenderInDefenseAreaPartially' :
      return `${teamAndBot(gameEvent.event.value)} 部分进入己方禁区触球`
    default:
      return '未知比赛事件'
  }
}
