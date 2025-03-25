#!/bin/bash
# Quick API test script for DirectoryMonster

echo "Testing DirectoryMonster API..."
echo "------------------------------"

# Create a test data file
cat > test-product.json << 'EOL'
{
  "siteSlug": "unique-products",
  "categoryId": "category_1742883720947",
  "title": "Test API Product Item",
  "metaDescription": "This is a test product to verify API functionality",
  "content": "This is a detailed description of the test product.",
  "imageUrl": "https://example.com/test-image.jpg",
  "backlinkUrl": "https://example.com/product/test",
  "backlinkAnchorText": "View the Test Item",
  "customFields": {
    "product_name": "Test API Item",
    "brand": "Test API Brand",
    "price": "$99.99"
  }
}
EOL

echo "Sending POST request to create product..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-api-key" \
  --data @test-product.json \
  http://localhost:3000/api/products

echo -e "\n\n------------------------------"
echo "API test completed"