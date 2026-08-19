ESX = exports["es_extended"]:getSharedObject()
local isInventoryOpen = false

RegisterNetEvent('la_hud:toggleInventory')
AddEventHandler('la_hud:toggleInventory', function()
    isInventoryOpen = not isInventoryOpen
    SetNuiFocus(isInventoryOpen, isInventoryOpen)
    SendNUIMessage({
        action = "toggleInventory",
        state = isInventoryOpen
    })
end)

-- Live HUD Status Update Loop
CreateThread(function()
    while true do
        Wait(500)
        local playerPed = PlayerPedId()
        local health = GetEntityHealth(playerPed) - 100
        local armor = GetPedArmour(playerPed)
        
        SendNUIMessage({
            action = "updateHUD",
            health = health,
            armor = armor
        })
    end
end)