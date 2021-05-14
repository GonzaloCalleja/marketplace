pragma solidity ^0.5.0;

contract Marketplace {
    string public name;
    uint public productCount = 0;

    mapping(uint => Product) public products;

    struct Product {
        uint id;
        string name;
        uint price;
        address payable owner;
        bool purchased;
    }

    event ProductCreated(
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    event ProductPurchased(
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    constructor() public {
        name = "First Marketplace";
    }

    function createProduct(string memory _name, uint _price) public {
        // Make sure parameters are correct
        // Require valid name
        require(bytes(_name).length > 0);

        // Require valid price
        require(_price > 0);

        // Increment ProductCount
        productCount ++;

        // Create Product
        products[productCount] = Product(productCount, _name, _price, msg.sender, false);

        // Trigger Event
        emit ProductCreated(productCount, _name, _price, msg.sender, false);
    }

    function purchaseProduct(uint _id) public payable{
        // Fetch Product
        Product memory _product = products[_id];

        // Fetch Owner
        address payable _seller = _product.owner;

        // Make sure product is valid
        // Product has  a valid id
        require(_product.id > 0 && _product.id <= productCount);

        //Enough ether in transaction
        require(msg.value >= _product.price);

        // Product has not already been purchased
        require(!_product.purchased);

        // The buyer is not the seller
        require(_seller != msg.sender);

        // Transfer Ownership to buyer
        _product.owner = msg.sender;

        // Mark as Purchased
        _product.purchased = true;

        // update product
        products[_id] = _product;

        // Pay seller with ether
        address(_seller).transfer(msg.value);

        // Trigger event
        // REVIEW THIS AND TRANSFER
        emit ProductPurchased(productCount, _product.name, _product.price, msg.sender, true);
    }
}