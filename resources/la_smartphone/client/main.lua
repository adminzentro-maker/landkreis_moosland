RegisterKeyMapping('phone', 'Handy öffnen', 'keyboard', 'F2')

RegisterCommand('phone', function()
    SetNuiFocus(true, true)
    SendNUIMessage({ action = "openPhone" })
end)