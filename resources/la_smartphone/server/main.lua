ESX = exports["es_extended"]:getSharedObject()

RegisterNetEvent('la_phone:sendCrypto')
AddEventHandler('la_phone:sendCrypto', function(symbol, amount, recipientPhone)
    local src = source
    print('[la_smartphone] Crypto Transfer: ' .. symbol .. ' amount: ' .. amount)
end)