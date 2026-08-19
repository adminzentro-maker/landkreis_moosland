ESX = exports["es_extended"]:getSharedObject()

RegisterNetEvent('la_heists:vaultOpened')
AddEventHandler('la_heists:vaultOpened', function(bankId)
    local src = source
    local xPlayer = ESX.GetPlayerFromId(src)
    local reward = math.random(Config.Banks.Fleeca_Pacific.rewardMin, Config.Banks.Fleeca_Pacific.rewardMax)
    
    xPlayer.addAccountMoney('black_money', reward)
    TriggerClientEvent('esx:showNotification', src, '~g~Vault geknackt! Beute: $' .. reward)
end)