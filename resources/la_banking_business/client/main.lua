RegisterNUICallback('transferMoney', function(data, cb)
    TriggerServerEvent('la_banking:transferIBAN', data.targetIBAN, tonumber(data.amount))
    cb('ok')
end)