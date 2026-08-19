ESX = exports["es_extended"]:getSharedObject()

-- Event fired when payment is processed from website custom gateway
RegisterNetEvent('la_payment:onPaymentReceived')
AddEventHandler('la_payment:onPaymentReceived', function(paymentData)
    local ped = PlayerPedId()
    
    -- Play success sound & particle effect
    PlaySoundFrontend(-1, "LOCAL_PLYR_CASH_COUNTER_COMPLETE", "DLC_HEISTS_GENERAL_FRONTEND_SOUNDS", true)
    
    TriggerEvent('esx:showAdvancedNotification', 
        'LIFE PAYMENT GATEWAY', 
        '~g~Zahlung Erfolgreich!', 
        'Paket: ~y~' .. tostring(paymentData.scriptName) .. '~s~ wurde für deinen Account freigeschaltet.', 
        'CHAR_BANK_MAZE', 
        9
    )
end)

-- NUI Command for Ingame Payment Terminal
RegisterCommand('payterminal', function()
    SetNuiFocus(true, true)
    SendNUIMessage({ action = "openTerminal" })
end)