RegisterNetEvent('la_heists:startThermite')
AddEventHandler('la_heists:startThermite', function(bankId)
    local ped = PlayerPedId()
    TaskStartScenarioInPlace(ped, "WORLD_HUMAN_WELDING", 0, true)
    
    exports['la_minigames']:StartThermite(function(success)
        ClearPedTasks(ped)
        if success then
            TriggerServerEvent('la_heists:vaultOpened', bankId)
        else
            TriggerEvent('esx:showNotification', '~r~Thermit Fehlgeschlagen! Notruf ausgelöst.')
        end
    end)
end)