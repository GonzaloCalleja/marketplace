//const { assert } = require("chai");

const { assert } = require('chai');

require('chai')
    .use(require('chai-as-promised'))
    .should()

const Marketplace = artifacts.require("Marketplace");

contract('Markeplace', ([deployer, seller, buyer]) => {
    
    let market

    before (async () => {
        market = await Marketplace.deployed();
    })

    describe('deployment', async() => {
        it('deploys successfully', async () => {
            const address = await market.address;
            assert.notEqual(address, 0x0);
            assert.notEqual(address, '');
            assert.notEqual(address, null);
            assert.notEqual(address, undefined);
        })

        it('has a name', async () => {
            const name = await market.name();
            assert.equal(name, "First Marketplace")
        })

    })

    describe('products', async() => {

        let result, productCount

        before (async () => {
            result = await market.createProduct('iPhone X', web3.utils.toWei('1', 'Ether'), { from: seller });
            productCount = await market.productCount();
        })

        it('creates products', async () => {
            // SUCCESS
            assert.equal(productCount, 1)
            const event = result.logs[0].args
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'Id is correct')
            assert.equal(event.name, 'iPhone X', 'Name is correct')
            assert.equal(event.price, '1000000000000000000', 'Price is correct')
            assert.equal(event.owner, seller, 'Owner is correct')
            assert.equal(event.purchased, false, 'Purchased is correct')

            //FAILURE
            // must have a name
            await market.createProduct('', web3.utils.toWei('1', 'Ether'), { from: seller }).should.be.rejected;

            // must have  a Price
            await market.createProduct('iPhone X', 0, { from: seller }).should.be.rejected;
        })

        it('lists products', async () => {
            
            const product = await market.products(productCount);
            assert.equal(product.id.toNumber(), productCount.toNumber(), 'Id is correct')
            assert.equal(product.name, 'iPhone X', 'Name is correct')
            assert.equal(product.price, '1000000000000000000', 'Price is correct')
            assert.equal(product.owner, seller, 'Owner is correct')
            assert.equal(product.purchased, false, 'Purchased is correct')
        })

        it('sells products', async () => {
            // Track the seller balance before purchase
            let oldSellerBalance
            oldSellerBalance = await web3.eth.getBalance(seller)
            oldSellerBalance = new web3.utils.BN(oldSellerBalance)


            // SUCCESS: Buyer makes purchase
            const result = await market.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('1', 'Ether')});

            // Check logs
            const event = result.logs[0].args
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'Id is correct')
            assert.equal(event.name, 'iPhone X', 'Name is correct')
            assert.equal(event.price, '1000000000000000000', 'Price is correct')
            assert.equal(event.owner, buyer, 'Owner is correct')
            assert.equal(event.purchased, true, 'Purchased is correct')

            // Check seller receives funds
            let newSellerBalance
            newSellerBalance = await web3.eth.getBalance(seller)
            newSellerBalance = new web3.utils.BN(newSellerBalance)

            let price = web3.utils.toWei('1', 'Ether')
            price = new web3.utils.BN(price)

            const expectedBalance = oldSellerBalance.add(price)

            assert.equal(newSellerBalance.toString(), expectedBalance.toString())

            //FAILURE: The product must exist
            await market.purchaseProduct(99, {from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;

            //FAILURE: Try to buy with too little ether
            await market.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('0.5', 'Ether')}).should.be.rejected;

            //FAILURE: Deployer tries to buy product (other account tries to also buy)
            await market.purchaseProduct(productCount, {from: deployer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;

            //FAILURE: buyer tries to buy again (from himself)
            await market.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;

        })

    })


})