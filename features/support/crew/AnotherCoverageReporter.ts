import {Actor, LogicError, Stage, StageCrewMember} from '@serenity-js/core'
import {
    ActorEntersStage,
    AsyncOperationAttempted,
    AsyncOperationCompleted,
    AsyncOperationFailed,
    DomainEvent,
} from '@serenity-js/core/lib/events'
import {CorrelationId, Description, Name} from '@serenity-js/core/lib/model'
import {PlaywrightPage} from '@serenity-js/playwright'

type ActorName = string

export class AnotherCoverageReporter implements StageCrewMember {
    private readonly coverageReports = new Map<ActorName, any>()

    constructor(private stage?: Stage) {}

    assignedTo(stage: Stage): StageCrewMember {
        this.stage = stage
        return this
    }

    notifyOf(event: DomainEvent): void {
        if (!this.stage) {
            throw new LogicError(
                `CoverageReporter needs to be assigned to the Stage before it can be notified of any DomainEvents`,
            )
        }

        if (
            event instanceof ActorEntersStage &&
      event.actor.abilities.some((ability) => ability.type === 'BrowseTheWeb') &&
      !this.coverageReports.has(event.actor.name)
        ) {
            this.startCoverageFor(this.stage.actor(event.actor.name))
        }

    // if (event instanceof SceneFinishes) {
    //   for (const [actor, coverage] of this.coverageReports) {
    //     this.stopCoverageFor(actorInTheSpotlight());
    //   }
    // }
    }

    private async startCoverageFor(actor: Actor) {
        const id = CorrelationId.create()
        this.stage?.announce(
            new AsyncOperationAttempted(
                new Name(`CoverageCollector:${this.constructor.name}`),
                new Description('Starting collecting coverage...'),
                id,
                this.stage.currentTime(),
            ),
        )
        try {
            const page = await actor.answer(PlaywrightPage.current().nativePage())
            page.coverage.startJSCoverage({ resetOnNavigation: false })
            return this.stage?.announce(new AsyncOperationCompleted(id, this.stage.currentTime()))
        } catch (error) {
            if (error instanceof Error) {
                this.stage?.announce(new AsyncOperationFailed(error, id, this.stage.currentTime()))
            }
        }
    }

    private stopCoverageFor(actor: Actor) {
    // TODO needs to stop here
    }
}
