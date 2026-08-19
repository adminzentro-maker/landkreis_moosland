local currentVehicle = nil

RegisterNetEvent('la_tuning:applyStance')
AddEventHandler('la_tuning:applyStance', function(camber, trackWidth)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if veh ~= 0 then
        SetVehicleWheelXOffset(veh, 0, trackWidth)
        SetVehicleWheelXOffset(veh, 1, -trackWidth)
        -- Custom camber calculation offset
        TriggerEvent('esx:showNotification', '~g~Fahrwerkseinstellung angewendet!')
    end
end)