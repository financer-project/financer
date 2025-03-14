import TestUtilityDBContainer from "@/test/utility/TestUtilityDBContainer"
import TestUtilityMock from "@/test/utility/TestUtilityMock"

export default class TestUtilityFactory {
    static #dbContainer: TestUtilityDBContainer
    static #mock: TestUtilityMock

    static dbContainer(): TestUtilityDBContainer {
        if (!this.#dbContainer) {
            this.#dbContainer = new TestUtilityDBContainer()
        }
        return this.#dbContainer
    }

    static mock(): TestUtilityMock {
        if (!this.#mock) {
            this.#mock = new TestUtilityMock()
        }
        return this.#mock
    }
}