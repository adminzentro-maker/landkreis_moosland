ESX = exports["es_extended"]:getSharedObject()

RegisterNetEvent('la_banking:transferIBAN')
AddEventHandler('la_banking:transferIBAN', function(targetIBAN, amount)
    local src = source
    local xPlayer = ESX.GetPlayerFromId(src)
    if xPlayer.getBank() >= amount then
        xPlayer.removeAccountMoney('bank', amount)
        -- Process IBAN lookup
        TriggerClientEvent('esx:showNotification', src, '~g~$' .. amount .. ' erfolgreich überwiesen!')
    end
end)