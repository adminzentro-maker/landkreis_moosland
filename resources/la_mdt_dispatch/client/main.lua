RegisterNetEvent('la_mdt:openMDT')
AddEventHandler('la_mdt:openMDT', function()
    local xPlayer = ESX.GetPlayerData()
    if Config.JobsWithMDT[xPlayer.job.name] then
        SetNuiFocus(true, true)
        SendNUIMessage({ action = "openMDT", job = xPlayer.job.name })
    end
end)