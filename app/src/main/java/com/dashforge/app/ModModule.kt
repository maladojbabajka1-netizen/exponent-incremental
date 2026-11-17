package com.dashforge.app

enum class ModuleStatus {
    AVAILABLE,
    INSTALLED,
    DISABLED,
    INCOMPATIBLE
}

data class ModModule(
    val id: String,
    val name: String,
    val description: String,
    val version: String,
    val author: String,
    val supportedGameVersions: List<String>,
    val supportedAbis: List<String>,
    val status: ModuleStatus = ModuleStatus.AVAILABLE
) {
    fun isCompatible(
        gameVersion: String,
        deviceAbi: String
    ): Boolean {
        val gameSupported =
            gameVersion in supportedGameVersions

        val abiSupported =
            deviceAbi in supportedAbis

        return gameSupported && abiSupported
    }
}
