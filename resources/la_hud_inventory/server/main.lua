ESX = exports["es_extended"]:getSharedObject()

ESX.RegisterServerCallback('la_hud:getPlayerInventory', function(source, cb)
    local xPlayer = ESX.GetPlayerFromId(source)
    if xPlayer then
        cb({
            inventory = xPlayer.inventory,
            weight = xPlayer.getWeight(),
            maxWeight = Config.MaxWeight
        })
    else
        cb(nil)
    end
end)