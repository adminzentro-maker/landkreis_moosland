ESX = exports["es_extended"]:getSharedObject()

-- Server-side Webhook Listener for Website Payment Confirmations
RegisterNetEvent('la_payment:processWebPayment')
AddEventHandler('la_payment:processWebPayment', function(apiKey, txData)
    local src = source
    if apiKey ~= Config.ServerKey then
        print('[la_payment_gateway] SECURITY ALERT: Invalid API Key attempt!')
        return
    end

    local xPlayer = ESX.GetPlayerFromId(src)
    if xPlayer then
        -- Log transaction in MySQL database
        MySQL.Async.execute('INSERT INTO v3_payments (identifier, item_name, price, transaction_id, created_at) VALUES (@identifier, @item_name, @price, @tx_id, NOW())', {
            ['@identifier'] = xPlayer.getIdentifier(),
            ['@item_name'] = txData.scriptName,
            ['@price'] = txData.price,
            ['@tx_id'] = txData.txId
        }, function(rowsChanged)
            print('[la_payment_gateway] Transaction registered: ' .. txData.txId)
            
            -- Grant Ingame Items / Perks
            TriggerClientEvent('la_payment:onPaymentReceived', src, txData)
        end)
    end
end)