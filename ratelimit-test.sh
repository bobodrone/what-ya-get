for i in {1..105}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/items
done
